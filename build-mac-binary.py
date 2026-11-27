import json
import zipfile
import os
import shutil

with open("package.json", "r", encoding="utf-8") as pkg_file:
    app_version = json.load(pkg_file).get("version", "2.0.0")

src_zip_path = r"C:\Users\CyberWord\AppData\Local\electron\Cache\073c10f139c87e3badb3ab4fec283ab33ea3ccf18b5cb8ce88ffcc6cb893b618\electron-v34.5.8-darwin-x64.zip"
app_asar_path = r"release\win-unpacked\resources\app.asar"
out_zip_path = rf"release\Xivig-Text-Editor-{app_version}-mac-x64.zip"

print(f"Reading base Electron darwin zip: {src_zip_path}")
print(f"Injecting app.asar from: {app_asar_path}")

with open(app_asar_path, "rb") as f:
    app_asar_data = f.read()

app_name = "Xivig Text Editor"
bundle_name = f"{app_name}.app"

src_zip = zipfile.ZipFile(src_zip_path, "r")
out_zip = zipfile.ZipFile(out_zip_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6)

for item in src_zip.infolist():
    # Skip non-app root files
    if not item.filename.startswith("Electron.app/"):
        continue

    # Skip default_app.asar
    if item.filename == "Electron.app/Contents/Resources/default_app.asar":
        continue

    # Rename path from Electron.app/ to Xivig Text Editor.app/
    rel_path = item.filename[len("Electron.app/"):]
    new_filename = f"{bundle_name}/{rel_path}"

    # Rename executable
    if rel_path == "Contents/MacOS/Electron":
        new_filename = f"{bundle_name}/Contents/MacOS/{app_name}"

    # Handle Info.plist modifications
    if rel_path == "Contents/Info.plist":
        plist_content = src_zip.read(item).decode("utf-8", errors="ignore")
        plist_content = plist_content.replace("<string>Electron</string>", f"<string>{app_name}</string>")
        plist_content = plist_content.replace("<string>com.github.Electron</string>", "<string>com.xivig.texteditor</string>")
        data = plist_content.encode("utf-8")
        new_item = zipfile.ZipInfo(new_filename)
        new_item.external_attr = item.external_attr
        out_zip.writestr(new_item, data)
        print("Updated Contents/Info.plist")
        continue

    # Copy entry with same attributes/symlink metadata
    new_item = zipfile.ZipInfo(new_filename)
    new_item.external_attr = item.external_attr
    if item.is_dir():
        out_zip.writestr(new_item, b"")
    else:
        out_zip.writestr(new_item, src_zip.read(item))

# Add app.asar
asar_info = zipfile.ZipInfo(f"{bundle_name}/Contents/Resources/app.asar")
asar_info.external_attr = 0o644 << 16
out_zip.writestr(asar_info, app_asar_data)
print(f"Added {bundle_name}/Contents/Resources/app.asar ({len(app_asar_data)} bytes)")

src_zip.close()
out_zip.close()

# Also create standard mac.zip alias
target_alias = rf"release\Xivig-Text-Editor-{app_version}-mac.zip"
shutil.copyfile(out_zip_path, target_alias)
print(f"Successfully generated macOS binaries:")
print(f" - {out_zip_path} ({os.path.getsize(out_zip_path):,} bytes)")
print(f" - {target_alias} ({os.path.getsize(target_alias):,} bytes)")
