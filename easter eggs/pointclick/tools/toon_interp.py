#!/usr/bin/env python3
"""Intervalles de dessin animé entre deux images clés avec ToonCrafter (Doubiiu/ToonCrafter, 512x320, 16 images), sur le GPU du Mac (MPS).
Lancer avec le Python de ~/Modèles IA/ToonCrafter/.venv, par calcul-lourd (un seul calcul lourd à la fois) :
  calcul-lourd "$HOME/Modèles IA/ToonCrafter/.venv/bin/python" toon_interp.py debut.png fin.png sortie_dir "consigne" [--fs 10] [--steps 50] [--seed 123]
  plusieurs paires d'un coup (modèle chargé une seule fois) : --batch liste.tsv
  (lignes : debut  fin  sortie_dir  consigne  [fs]  [graine], séparés par des tabulations ; fs et graine par défaut : ceux de la commande)
Les images d'entrée doivent déjà être au format 512x320 (fond uni, personnage cadré) ; sortie : sortie_dir/f00.png … f15.png."""
import sys, os, argparse, math
D = os.path.join(os.path.expanduser('~'), 'Modèles IA', 'ToonCrafter', 'code')
sys.path.insert(0, D)
os.environ.setdefault('PYTORCH_ENABLE_MPS_FALLBACK', '1')   # redimensionnement bicubique (préparation de l'image pour CLIP) absent du GPU Apple : passe par le processeur
import torch
import torch.utils.checkpoint   # le code d'origine l'utilise sans l'importer
import types
# xformers (cartes NVIDIA seulement) : seule sa fonction d'attention est utilisée ; l'équivalent de PyTorch tourne sur le GPU Apple
def _sdpa(q, k, v, m=None):
    """attention exacte, découpée en tranches de requêtes : l'attention de PyTorch sur le GPU Apple construit toute la matrice
    (100 Go pour le décodeur à pleine résolution), xformers ne la construisait jamais"""
    B, N, M = q.shape[0] * q.shape[1], q.shape[-2], k.shape[-2]
    step = max(256, int(1.5e9 / (4 * max(B, 1) * M)))
    if N <= step: return torch.nn.functional.scaled_dot_product_attention(q, k, v, attn_mask=m)
    out = [torch.nn.functional.scaled_dot_product_attention(q[..., i:i + step, :], k, v, attn_mask=None if m is None else m[..., i:i + step, :]) for i in range(0, N, step)]
    return torch.cat(out, dim=-2)
def _mea(q, k, v, attn_bias=None, op=None, **_):
    if q.dim() == 4:   # disposition xformers (B, M, H, K) -> (B, H, M, K)
        q, k, v = (t.transpose(1, 2) for t in (q, k, v))
        return _sdpa(q, k, v, attn_bias).transpose(1, 2)
    m = attn_bias.unsqueeze(0) if isinstance(attn_bias, torch.Tensor) else attn_bias   # l'attention du GPU Apple veut des tenseurs à 4 dimensions
    return _sdpa(q.unsqueeze(0), k.unsqueeze(0), v.unsqueeze(0), m).squeeze(0)
_xf = types.ModuleType('xformers'); _xf.__version__ = '0.0.20'; _xf.ops = types.ModuleType('xformers.ops'); _xf.ops.memory_efficient_attention = _mea
sys.modules['xformers'] = _xf; sys.modules['xformers.ops'] = _xf.ops
from omegaconf import OmegaConf
from einops import rearrange, repeat
from PIL import Image
import numpy as np

DEV = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')

# le code d'origine suppose une carte NVIDIA : le planificateur DDIM pousse ses tampons sur « cuda », le décodage passe par autocast("cuda")
import lvdm.models.samplers.ddim as ddim_mod
def _reg(self, name, attr):
    if isinstance(attr, torch.Tensor): attr = attr.to(DEV, dtype=torch.float32)
    setattr(self, name, attr)
ddim_mod.DDIMSampler.register_buffer = _reg
_autocast = torch.autocast
class _NoCudaAutocast:
    def __init__(self, device_type, *a, **k): self.c = _autocast(device_type, *a, **k) if device_type != 'cuda' else None
    def __enter__(self): return self.c.__enter__() if self.c else None
    def __exit__(self, *e): return self.c.__exit__(*e) if self.c else False
torch.autocast = _NoCudaAutocast
from utils.utils import instantiate_from_config
from lvdm.models.samplers.ddim import DDIMSampler


def load_model():
    cfg = OmegaConf.load(os.path.join(D, 'configs', 'inference_512_v1.0.yaml'))
    mc = cfg.pop('model', OmegaConf.create()); mc['params']['unet_config']['params']['use_checkpoint'] = False
    model = instantiate_from_config(mc); model.perframe_ae = True
    sd = torch.load(os.path.join(D, 'checkpoints', 'tooncrafter_512_interp_v1', 'model.ckpt'), map_location='cpu', weights_only=False)
    sd = sd.get('state_dict', sd); model.load_state_dict(sd, strict=True)
    model = model.to(DEV).eval()
    for m in (model.cond_stage_model, model.embedder):
        if hasattr(m, 'device'): m.device = DEV
    return model


def to_tensor(p):
    im = Image.open(p).convert('RGB').resize((512, 320), Image.LANCZOS)
    t = torch.from_numpy(np.asarray(im).astype(np.float32) / 127.5 - 1.0).permute(2, 0, 1)
    return t.unsqueeze(1)  # c 1 h w


@torch.no_grad()
def interp(model, a, b, prompt, fs=10, steps=50, seed=123, cfg=7.5, rescale=0.7, frames=16):
    torch.manual_seed(seed); np.random.seed(seed)
    ta, tb = to_tensor(a), to_tensor(b)
    vid = torch.cat([repeat(ta, 'c t h w -> c (r t) h w', r=frames // 2), repeat(tb, 'c t h w -> c (r t) h w', r=frames // 2)], dim=1).unsqueeze(0).to(DEV)
    h, w = 320 // 8, 512 // 8; ch = model.model.diffusion_model.out_channels
    noise_shape = [1, ch, frames, h, w]
    fs_t = torch.tensor([fs], dtype=torch.long, device=DEV)
    img = vid[:, :, 0]
    img_emb = model.image_proj_model(model.embedder(img))
    cond_emb = model.get_learned_conditioning([prompt])
    cond = {'c_crossattn': [torch.cat([cond_emb, img_emb], dim=1)]}
    x = rearrange(vid, 'b c t h w -> (b t) c h w')
    post, hid = model.first_stage_model.encode(x, return_hidden_states=True)
    hs = [torch.cat([rearrange(hh, '(b t) c h w -> b c t h w', t=frames)[:, :, 0:1], rearrange(hh, '(b t) c h w -> b c t h w', t=frames)[:, :, -1:]], dim=2) for hh in hid]
    z = rearrange(model.get_first_stage_encoding(post).detach(), '(b t) c h w -> b c t h w', b=1, t=frames)
    cat = torch.zeros_like(z); cat[:, :, 0] = z[:, :, 0]; cat[:, :, -1] = z[:, :, -1]
    cond['c_concat'] = [cat]
    uc_emb = model.get_learned_conditioning(['']) if model.uncond_type == 'empty_seq' else torch.zeros_like(cond_emb)
    uc_img = model.image_proj_model(model.embedder(torch.zeros_like(img)))
    uc = {'c_crossattn': [torch.cat([uc_emb, uc_img], dim=1)], 'c_concat': [cat]}
    sampler = DDIMSampler(model)
    samples, _ = sampler.sample(S=steps, conditioning=cond, batch_size=1, shape=noise_shape[1:], verbose=False, unconditional_guidance_scale=cfg,
                                unconditional_conditioning=uc, eta=1.0, cfg_img=None, mask=None, x0=None, fs=fs_t, timestep_spacing='uniform_trailing',
                                guidance_rescale=rescale, unconditional_conditioning_img_nonetext=None)
    kw = {'ref_context': hs}
    out = model.decode_first_stage(samples, **kw)
    idx = list(range(samples.shape[2])); del idx[1]; del idx[-2]
    mid = model.decode_first_stage(samples[:, :, idx], **kw)
    out[:, :, out.shape[2] // 2 - 1:out.shape[2] // 2 + 1] = mid[:, :, out.shape[2] // 2 - 2:out.shape[2] // 2]
    v = ((out[0].clamp(-1, 1) + 1) * 127.5).to(torch.uint8).permute(1, 2, 3, 0).cpu().numpy()  # t h w c
    return [Image.fromarray(f) for f in v]


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('a', nargs='?'); ap.add_argument('b', nargs='?'); ap.add_argument('out', nargs='?'); ap.add_argument('prompt', nargs='?', default='')
    ap.add_argument('--fs', type=int, default=10); ap.add_argument('--steps', type=int, default=50); ap.add_argument('--seed', type=int, default=123); ap.add_argument('--batch')
    a = ap.parse_args()
    jobs = [l.rstrip('\n').split('\t') for l in open(a.batch) if l.strip()] if a.batch else [[a.a, a.b, a.out, a.prompt]]
    model = load_model()
    for j in jobs:
        s, e, o, p = j[0], j[1], j[2], (j[3] if len(j) > 3 else '')
        fs = int(j[4]) if len(j) > 4 and j[4] else a.fs; seed = int(j[5]) if len(j) > 5 and j[5] else a.seed
        if os.path.exists(os.path.join(o, 'f15.png')): continue
        os.makedirs(o, exist_ok=True)
        for i, f in enumerate(interp(model, s, e, p, fs, a.steps, seed)): f.save(os.path.join(o, f'f{i:02d}.png'))
        print('ok', o, flush=True)


if __name__ == '__main__': main()
