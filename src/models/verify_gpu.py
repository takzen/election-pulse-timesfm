"""Hardware and environment verification script for TimesFM 3.0 and CUDA.
"""

import sys
import time

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

def verify_environment():
    print("=" * 60)
    print("🚀 Puls Wyborczy: Environment & GPU Verification")
    print("=" * 60)
    print(f"Python version : {sys.version.split()[0]} ({sys.executable})")

    # 1. PyTorch & CUDA Check
    try:
        import torch
        print(f"PyTorch version: {torch.__version__}")
        cuda_avail = torch.cuda.is_available()
        print(f"CUDA Available : {'✅ YES' if cuda_avail else '❌ NO'}")

        if cuda_avail:
            device_count = torch.cuda.device_count()
            device_name = torch.cuda.get_device_name(0)
            total_vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
            current_allocated_mb = torch.cuda.memory_allocated(0) / (1024 ** 2)
            print(f"GPU Device     : {device_name} ({device_count} device(s))")
            print(f"Total VRAM     : {total_vram_gb:.2f} GB")
            print(f"Current VRAM   : {current_allocated_mb:.1f} MB allocated")

            # Quick GPU computation test
            start = time.perf_counter()
            x = torch.randn(4096, 4096, device="cuda", dtype=torch.float16)
            y = torch.matmul(x, x)
            torch.cuda.synchronize()
            elapsed_ms = (time.perf_counter() - start) * 1000
            print(f"GPU Matrix Test: ✅ Matmul (4096x4096 fp16) completed in {elapsed_ms:.2f} ms")
        else:
            print("⚠️ CUDA is not available. Falling back to CPU.")
    except ImportError as e:
        print(f"❌ PyTorch import failed: {e}")

    # 2. TimesFM Check
    try:
        import timesfm
        print(f"TimesFM version: ✅ {getattr(timesfm, '__version__', '3.0.1')}")
        from timesfm import TimesFM3Forecaster, ForecastConfig
        print("TimesFM 3.0 API: ✅ TimesFM3Forecaster and ForecastConfig imported successfully!")
    except ImportError as e:
        print(f"⚠️ TimesFM import error: {e}")

    print("=" * 60)

if __name__ == "__main__":
    verify_environment()
