    # #!/usr/bin/env python3
    # import argparse
    # import json
    # import os
    # import sys

    # # Optional heavy deps (OpenCV/Open3D) are imported inside functions
    # # so this script can still run and produce JSON even if they're missing.

    # def load_and_resize_image(image_path: str, scale_percent: int = 50):
    #     """Load and resize image with OpenCV if available. Returns (w, h) after resize."""
    #     try:
    #         import cv2  # type: ignore
    #     except Exception as e:
    #         print(f"[WARN] OpenCV not available, skipping resize. ({e})", file=sys.stderr)
    #         # We can only return dummy dims if OpenCV isn't available
    #         return None

    #     img = cv2.imread(image_path)
    #     if img is None:
    #         raise FileNotFoundError(f"Image not found or unreadable: {image_path}")

    #     width = max(1, int(img.shape[1] * scale_percent / 100))
    #     height = max(1, int(img.shape[0] * scale_percent / 100))
    #     resized = cv2.resize(img, (width, height))
    #     # Optionally, you can write it somewhere, but node backend doesn't need it.
    #     return (width, height)


    # def preprocess_mesh_or_fallback(model_path: str | None):
    #     """
    #     Try to load and clean a mesh with Open3D. If not available or failed,
    #     fall back to a simple procedural box mesh (if Open3D exists).
    #     Returns (mesh, meta_note).
    #     """
    #     try:
    #         import open3d as o3d  # type: ignore
    #         import numpy as np    # type: ignore
    #     except Exception as e:
    #         # No Open3D/NumPy — can't create a mesh; return None so backend will fallback GLB.
    #         return None, f"Open3D/NumPy unavailable, GLB will not be produced. ({e})"

    #     mesh = None
    #     note = ""

    #     try:
    #         if model_path and os.path.exists(model_path):
    #             mesh = o3d.io.read_triangle_mesh(model_path)
    #             if mesh is None or (hasattr(mesh, 'has_triangles') and not mesh.has_triangles()):
    #                 note = f"Provided model invalid, switching to primitive box."
    #                 mesh = None
    #         else:
    #             note = "No model path provided, using primitive box."
    #     except Exception as e:
    #         note = f"Failed to load model: {e}"

    #     if mesh is None:
    #         # Primitive fallback
    #         mesh = o3d.geometry.TriangleMesh.create_box(width=1.0, height=0.3, depth=0.2)

    #     # Cleanup mesh
    #     try:
    #         # Some of these calls may not exist on older Open3D; guard them.
    #         if hasattr(mesh, "remove_duplicated_vertices"): mesh.remove_duplicated_vertices()
    #         if hasattr(mesh, "remove_degenerate_triangles"): mesh.remove_degenerate_triangles()
    #         if hasattr(mesh, "remove_duplicated_triangles"): mesh.remove_duplicated_triangles()
    #         if hasattr(mesh, "remove_non_manifold_edges"): mesh.remove_non_manifold_edges()
    #         if hasattr(mesh, "remove_unreferenced_vertices"): mesh.remove_unreferenced_vertices()
    #         if hasattr(mesh, "compute_vertex_normals"): mesh.compute_vertex_normals()
    #     except Exception as e:
    #         note += f" | Cleanup warning: {e}"

    #     # Normalize scale & center (best-effort)
    #     try:
    #         if hasattr(mesh, "get_max_bound") and hasattr(mesh, "get_min_bound"):
    #             max_b = mesh.get_max_bound()
    #             min_b = mesh.get_min_bound()
    #             extent = max((max_b - min_b).tolist())
    #             if extent > 0:
    #                 mesh.scale(1.0 / extent, center=mesh.get_center())
    #             mesh.translate(-mesh.get_center())
    #     except Exception as e:
    #         note += f" | Normalize warning: {e}"

    #     # Rotate mesh (optional, keeps compatibility with your earlier sample)
    #     try:
    #         R2 = mesh.get_rotation_matrix_from_axis_angle([0, -3.14159265 / 2, 0])
    #         mesh.rotate(R2, center=(0, 0, 0))
    #     except Exception as e:
    #         note += f" | Rotate warning: {e}"

    #     return mesh, note.strip()


    # def mesh_stats(mesh):
    #     """Return simple stats dict from an Open3D mesh."""
    #     try:
    #         import numpy as np  # type: ignore
    #     except Exception:
    #         return {}

    #     stats = {}
    #     try:
    #         if hasattr(mesh, "vertices"):
    #             stats["vertex_count"] = len(mesh.vertices)
    #         if hasattr(mesh, "triangles"):
    #             stats["triangle_count"] = len(mesh.triangles)
    #         if hasattr(mesh, "get_min_bound") and hasattr(mesh, "get_max_bound"):
    #             mn = mesh.get_min_bound().tolist()
    #             mx = mesh.get_max_bound().tolist()
    #             size = (mesh.get_max_bound() - mesh.get_min_bound()).tolist()
    #             stats["bbox_min"] = mn
    #             stats["bbox_max"] = mx
    #             stats["bbox_size"] = size
    #     except Exception as e:
    #         stats["warn"] = f"Failed computing stats: {e}"
    #     return stats


    # def write_glb(mesh, out_glb_path):
    #     """
    #     Try to write GLB using Open3D. If writing fails (e.g., build lacks GLTF),
    #     we just return False so Node backend will fallback to Model1.glb.
    #     """
    #     try:
    #         import open3d as o3d  # type: ignore
    #     except Exception as e:
    #         print(f"[WARN] Open3D not available; cannot write GLB. ({e})", file=sys.stderr)
    #         return False

    #     try:
    #         # Open3D can often export .glb via write_triangle_mesh if GLTF support is compiled in.
    #         ok = o3d.io.write_triangle_mesh(out_glb_path, mesh, write_triangle_uvs=True)
    #         if not ok:
    #             print(f"[WARN] write_triangle_mesh returned False for {out_glb_path}", file=sys.stderr)
    #         return bool(ok)
    #     except Exception as e:
    #         print(f"[WARN] Failed writing GLB: {e}", file=sys.stderr)
    #         return False


    # def main():
    #     parser = argparse.ArgumentParser(description="PythonManager: image->3D pipeline entrypoint")
    #     parser.add_argument("--input", required=True, help="Path to input image (jpg/png)")
    #     parser.add_argument("--out_glb", required=True, help="Output GLB path")
    #     parser.add_argument("--out_json", required=True, help="Output JSON metadata path")
    #     parser.add_argument("--model", default=None, help="(Optional) Path to a base GLB/mesh to preprocess")
    #     parser.add_argument("--scale", type=int, default=50, help="Resize percent for preview/metadata")
    #     parser.add_argument("--headless", action="store_true", help="Do not open any windows")
    #     args = parser.parse_args()

    #     # Validate input image presence (hard requirement)
    #     if not os.path.exists(args.input):
    #         print(f"[ERROR] Input image not found: {args.input}", file=sys.stderr)
    #         sys.exit(2)

    #     # Ensure output directories exist
    #     os.makedirs(os.path.dirname(os.path.abspath(args.out_glb)), exist_ok=True)
    #     os.makedirs(os.path.dirname(os.path.abspath(args.out_json)), exist_ok=True)

    #     # 1) Try to read/resize image (optional)
    #     resized_dims = None
    #     try:
    #         resized_dims = load_and_resize_image(args.input, args.scale)
    #     except FileNotFoundError as e:
    #         print(f"[ERROR] {e}", file=sys.stderr)
    #         sys.exit(2)
    #     except Exception as e:
    #         print(f"[WARN] Skipping image resize: {e}", file=sys.stderr)

    #     # 2) Load/preprocess mesh or create a fallback primitive
    #     mesh, prep_note = preprocess_mesh_or_fallback(args.model)

    #     # 3) Build metadata
    #     meta = {
    #         "status": "ok",
    #         "notes": "Dummy pipeline (replace with your ML).",
    #         "preprocess_note": prep_note,
    #         "input_image_basename": os.path.basename(args.input),
    #         "resized_dims": {"width": resized_dims[0], "height": resized_dims[1]} if resized_dims else None,
    #         "measures": {},
    #     }

    #     # Fill stats if we have a mesh
    #     if mesh is not None:
    #         try:
    #             stats = mesh_stats(mesh)
    #             meta["measures"].update(stats)
    #             meta["measures"]["confidence"] = 0.87  # placeholder
    #         except Exception as e:
    #             meta["measures"]["warn"] = f"Stats failed: {e}"

    #     # 4) Write JSON (always do this)
    #     try:
    #         with open(args.out_json, "w", encoding="utf-8") as f:
    #             json.dump(meta, f, indent=2)
    #     except Exception as e:
    #         print(f"[WARN] Failed writing JSON: {e}", file=sys.stderr)

    #     # 5) Try writing GLB. If this fails (e.g., Open3D missing GLTF), we still exit 0.
    #     wrote_glb = False
    #     if mesh is not None:
    #         wrote_glb = write_glb(mesh, args.out_glb)

    #     if wrote_glb:
    #         print(f"[INFO] GLB written to: {args.out_glb}")
    #     else:
    #         print("[INFO] GLB not produced. Backend will fallback to placeholder Model1.glb.")

    #     # IMPORTANT: exit 0 so Node backend proceeds (it has a fallback GLB).
    #     sys.exit(0)


    # if __name__ == "__main__":
    #     main()

#!/usr/bin/env python3
#!/usr/bin/env python3
import argparse
import json
import os
import sys
import shutil
from typing import Optional, Tuple

# Path to fallback GLB inside your project (Backend/assets/Model1.glb)
FALLBACK_GLB_PATH = os.path.join(
    os.path.dirname(__file__),  # Backend/
    "assets",
    "Model1.glb"
)

def load_and_resize_image(image_path: str, scale_percent: int = 50) -> Optional[Tuple[int, int]]:
    """Load and (optionally) resize image; returns (width, height) or None if OpenCV unavailable."""
    try:
        import cv2  # type: ignore
    except Exception as e:
        print(f"[WARN] OpenCV not available, skipping resize. ({e})", file=sys.stderr)
        return None

    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Image not found or unreadable: {image_path}")

    width = max(1, int(img.shape[1] * scale_percent / 100))
    height = max(1, int(img.shape[0] * scale_percent / 100))
    _ = cv2.resize(img, (width, height))
    return (width, height)


def try_copy_glb_as_is(src_glb: str, dst_glb: str) -> bool:
    """Binary-copy an existing .glb without modification."""
    try:
        if not os.path.exists(src_glb):
            return False
        if not src_glb.lower().endswith('.glb'):
            return False
        shutil.copyfile(src_glb, dst_glb)
        return True
    except Exception as e:
        print(f"[WARN] Raw GLB copy failed: {e}", file=sys.stderr)
        return False


def preprocess_mesh_or_fallback(model_path: Optional[str]):
    """
    Try to load a non-GLB mesh via Open3D, else create a primitive box.
    Returns (mesh, note) or (None, note) if Open3D not available.
    """
    try:
        import open3d as o3d  # type: ignore
        import numpy as np    # type: ignore
    except Exception as e:
        return None, f"Open3D/NumPy unavailable, GLB will not be produced. ({e})"

    mesh = None
    note = ""

    try:
        if model_path and os.path.exists(model_path) and not model_path.lower().endswith('.glb'):
            mesh = o3d.io.read_triangle_mesh(model_path)
            if mesh is None or (hasattr(mesh, 'has_triangles') and not mesh.has_triangles()):
                note = "Provided model invalid, switching to primitive box."
                mesh = None
        elif not model_path:
            note = "No model path provided, using primitive box."
    except Exception as e:
        note = f"Failed to load model: {e}"

    if mesh is None:
        try:
            mesh = o3d.geometry.TriangleMesh.create_box(width=1.0, height=0.3, depth=0.2)
        except Exception as e:
            return None, f"Failed to create primitive: {e}"

    try:
        if hasattr(mesh, "compute_vertex_normals"):
            mesh.compute_vertex_normals()
    except Exception as e:
        note += f" | normals warn: {e}"

    return mesh, note.strip()


def mesh_stats(mesh):
    """Return simple stats dict from an Open3D mesh (best-effort)."""
    try:
        import numpy as np  # type: ignore
    except Exception:
        return {}

    stats = {}
    try:
        if hasattr(mesh, "vertices"):
            stats["vertex_count"] = len(mesh.vertices)
        if hasattr(mesh, "triangles"):
            stats["triangle_count"] = len(mesh.triangles)
        if hasattr(mesh, "get_min_bound") and hasattr(mesh, "get_max_bound"):
            mn = mesh.get_min_bound().tolist()
            mx = mesh.get_max_bound().tolist()
            size = (mesh.get_max_bound() - mesh.get_min_bound()).tolist()
            stats["bbox_min"] = mn
            stats["bbox_max"] = mx
            stats["bbox_size"] = size
    except Exception as e:
        stats["warn"] = f"Failed computing stats: {e}"
    return stats


def write_glb_from_mesh(mesh, out_glb_path: str) -> bool:
    """Write GLB via Open3D; return True on success."""
    try:
        import open3d as o3d  # type: ignore
    except Exception as e:
        print(f"[WARN] Open3D not available; cannot write GLB. ({e})", file=sys.stderr)
        return False
    try:
        ok = o3d.io.write_triangle_mesh(out_glb_path, mesh, write_triangle_uvs=True)
        if not ok:
            print(f"[WARN] write_triangle_mesh returned False for {out_glb_path}", file=sys.stderr)
        return bool(ok)
    except Exception as e:
        print(f"[WARN] Failed writing GLB: {e}", file=sys.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(description="PythonManager: image->3D pipeline entrypoint")
    parser.add_argument("--input", required=True, help="Path to input image (jpg/png)")
    parser.add_argument("--out_glb", required=True, help="Output GLB path")
    parser.add_argument("--out_json", required=True, help="Output JSON metadata path")
    parser.add_argument("--model", default=None, help="Path to an existing GLB or other mesh")
    parser.add_argument("--scale", type=int, default=50, help="Resize percent for preview/metadata")
    parser.add_argument("--headless", action="store_true", help="Do not open any windows")
    args = parser.parse_args()

    # Validate input image
    if not os.path.exists(args.input):
        print(f"[ERROR] Input image not found: {args.input}", file=sys.stderr)
        sys.exit(2)

    # Ensure output dirs exist
    os.makedirs(os.path.dirname(os.path.abspath(args.out_glb)), exist_ok=True)
    os.makedirs(os.path.dirname(os.path.abspath(args.out_json)), exist_ok=True)

    # (Optional) image resize metadata
    resized_dims = None
    try:
        resized_dims = load_and_resize_image(args.input, args.scale)
    except FileNotFoundError as e:
        print(f"[ERROR] {e}", file=sys.stderr)
        sys.exit(2)
    except Exception as e:
        print(f"[WARN] Skipping image resize: {e}", file=sys.stderr)

    # ---- Decide what GLB to produce/upload (ORDER MATTERS) ----
    wrote_glb = False
    prep_note = ""

    # 1) If a .glb is provided via --model, copy it AS-IS
    if args.model and args.model.lower().endswith('.glb'):
        wrote_glb = try_copy_glb_as_is(args.model, args.out_glb)
        prep_note = "Raw GLB copied as-is." if wrote_glb else "Raw GLB copy failed."

    # 2) If not provided (or copy failed), prefer the big fallback Model1.glb
    if not wrote_glb and os.path.exists(FALLBACK_GLB_PATH):
        try:
            shutil.copyfile(FALLBACK_GLB_PATH, args.out_glb)
            wrote_glb = True
            prep_note += " | Used fallback Model1.glb"
        except Exception as e:
            print(f"[WARN] Fallback copy failed: {e}", file=sys.stderr)

    # 3) Only if neither worked, try a tiny procedural mesh (last resort)
    mesh = None
    if not wrote_glb:
        mesh, prep_note2 = preprocess_mesh_or_fallback(args.model)
        prep_note = (prep_note + " " + (prep_note2 or "")).strip()
        if mesh is not None:
            wrote_glb = write_glb_from_mesh(mesh, args.out_glb)

    # (Debug) Log final size to confirm which file was produced
    if wrote_glb and os.path.exists(args.out_glb):
        try:
            size_mb = os.path.getsize(args.out_glb) / (1024 * 1024)
            print(f"[INFO] Final GLB size: {size_mb:.2f} MB")
        except Exception:
            pass

    # ---- JSON metadata (always) ----
    meta = {
        "status": "ok",
        "notes": "Pipeline placeholder. Replace with ML output.",
        "preprocess_note": prep_note.strip(),
        "input_image_basename": os.path.basename(args.input),
        "resized_dims": {"width": resized_dims[0], "height": resized_dims[1]} if resized_dims else None,
        "measures": {}
    }
    if mesh is not None:
        meta["measures"].update(mesh_stats(mesh))

    try:
        with open(args.out_json, "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2)
    except Exception as e:
        print(f"[WARN] Failed writing JSON: {e}", file=sys.stderr)

    if wrote_glb:
        print(f"[INFO] GLB ready at: {args.out_glb}")
    else:
        print("[ERROR] No GLB could be produced, and no fallback found.")

    # Always exit 0 so Node backend proceeds (it handles errors/fallbacks too)
    sys.exit(0)


if __name__ == "__main__":
    main()