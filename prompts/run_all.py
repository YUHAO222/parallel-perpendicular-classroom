# -*- coding: utf-8 -*-
"""按 prompts_all.json 批量投喂 ComfyUI（25 步 + BlockCache 加速）。
用法:
  python run_all.py                 # 全部 36 段
  python run_all.py 2-1 2-2 3-1     # 只跑指定编号（也支持 00_entrance_both / idle）
"""
import json, os, sys, time, urllib.request, urllib.error

SERVER = "http://127.0.0.1:8188"
HERE = os.path.dirname(os.path.abspath(__file__))
MODELS = {
    "clip": "qwen3vl_32b_minimax_h3_ultra_uncensored_heretic_int8_convrot.safetensors",
    "unet_ref2va": "minimax_h3_ref2va_pruned_int8_convrot.safetensors",
    "vae_video": "minimax_h3_video_vae_fp16.safetensors",
    "vae_audio": "minimax_h3_audio_vae_fp32.safetensors",
}
SEGS = json.load(open(os.path.join(HERE, "prompts_all.json"), encoding="utf-8"))


def build(seg, seed):
    n = {}
    n["1"] = {"class_type": "CLIPLoader", "inputs": {"clip_name": MODELS["clip"], "type": "minimax", "device": "default"}}
    n["2"] = {"class_type": "VAELoader", "inputs": {"vae_name": MODELS["vae_video"]}}
    n["3"] = {"class_type": "VAELoader", "inputs": {"vae_name": MODELS["vae_audio"]}}
    n["4"] = {"class_type": "UNETLoader", "inputs": {"unet_name": MODELS["unet_ref2va"], "weight_dtype": "default"}}
    n["5"] = {"class_type": "PathchSageAttentionKJ", "inputs": {"model": ["4", 0], "sage_attention": "auto", "allow_compile": False}}
    n["7"] = {"class_type": "MiniMaxH3BlockCacheT8", "inputs": {
        "model": ["5", 0], "residual_diff_threshold": 0.12, "start_percent": 0.08,
        "end_percent": 0.95, "max_consecutive_hits": 3, "cache_device": "cpu",
        "metric_stride": 8, "verbose": False}}
    for i, f in enumerate(seg["refs"]):
        n[str(100 + i)] = {"class_type": "LoadImage", "inputs": {"image": "pingxing/" + f}}
    n["20"] = {"class_type": "MiniMaxH3ReferenceToVideo", "inputs": {
        "clip": ["1", 0], "vae": ["2", 0], "audio_vae": ["3", 0],
        "ref_images": [[str(100 + i), 0] for i in range(len(seg["refs"]))], "prompt": seg["prompt"],
        "width": 1344, "height": 768, "length": seg["length"], "ref_image_size": "match"}}
    n["21"] = {"class_type": "BasicGuider", "inputs": {"model": ["7", 0], "conditioning": ["20", 0]}}
    n["22"] = {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "res_multistep"}}
    n["23"] = {"class_type": "BasicScheduler", "inputs": {"model": ["7", 0], "scheduler": "simple", "steps": 25, "denoise": 1.0}}
    n["24"] = {"class_type": "RandomNoise", "inputs": {"noise_seed": seed}}
    n["25"] = {"class_type": "SamplerCustomAdvanced", "inputs": {
        "noise": ["24", 0], "guider": ["21", 0], "sampler": ["22", 0], "sigmas": ["23", 0], "latent_image": ["20", 1]}}
    n["26"] = {"class_type": "VAEDecode", "inputs": {"samples": ["25", 0], "vae": ["2", 0]}}
    n["27"] = {"class_type": "VAEDecodeAudio", "inputs": {"samples": ["25", 0], "vae": ["3", 0]}}
    n["28"] = {"class_type": "VHS_VideoCombine", "inputs": {
        "images": ["26", 0], "audio": ["27", 0], "frame_rate": 24, "loop_count": 0,
        "filename_prefix": seg["prefix"], "format": "video/h264-mp4",
        "pix_fmt": "yuv420p", "crf": 19, "save_metadata": True, "trim_to_audio": False,
        "pingpong": False, "save_output": True}}
    return {"prompt": n, "client_id": "hermes-h3-all"}


if __name__ == "__main__":
    want = set(sys.argv[1:])
    todo = [s for s in SEGS if not want or s["id"] in want]
    print(f"准备提交 {len(todo)} 段")
    for i, s in enumerate(todo):
        req = urllib.request.Request(SERVER + "/prompt", data=json.dumps(build(s, 70000 + i * 97)).encode(),
                                     headers={"Content-Type": "application/json"})
        try:
            out = json.loads(urllib.request.urlopen(req, timeout=60).read().decode())
            print(f"[{s['id']}] OK {out.get('prompt_id')} errors={out.get('node_errors')}", flush=True)
        except urllib.error.HTTPError as e:
            print(f"[{s['id']}] HTTP {e.code}: {e.read().decode()[:600]}", flush=True)
        time.sleep(1)
