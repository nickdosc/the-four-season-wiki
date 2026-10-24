#!/usr/bin/env python3
"""Safely install V1.2 or upgrade an existing V1 / V1.1 Linux Mint wiki.
Never modify edited theme files, git history, existing articles or uploads.
"""
from pathlib import Path
import hashlib,json,os,shutil,subprocess,sys,tempfile

BASELINE_HASHES = {'index.html': ['a5cc3bbeda0e43dc0646aa506162538a683883802fcad689e402ef458f4e8ba9', 'da5a503f6f17db3167f941c80681db5727235a9438b40fbfc97368ca50704400'], 'assets/app.js': ['19bffcab341762f0848ea7095ea0ddf37b4d383a61552dd6f5674a651005f622', 'a84127bcdfdfa0559565a0ae2c3b7f442ba34d16a69aeab6b2fe038e2b60f160'], 'assets/style.css': ['d1bd608b7a5bb924e96614dbcbcfe149b1b27f554cc2b5a2883a79e15b94092d', 'dd4c49e8f32aff1ef197d2688c288e7bd8b62e531d4bd3f2fad7f0cca9a63cfa'], 'README.md': ['3dcd571edf3e7a4fe2a373abea017ef667a37fc407d31c95c8dd2394990574ac', '499a7338cb185fd657c5a88cb44c5481cc1e96d1230ad14f8d7065c90acb0376'], 'tools/verify_linux.sh': ['304775b4d5ccfe42afd09b20421d18d6f6c51aa85282e07a241a2939821b0fe3', '5d5e5d6ba155f592c0daa8af07c2db79faf1883890c7a6b63c4c01f3bc26d401'], 'tools/preview_linux.sh': ['1eb0afa58e63679daa2f8f3a648415469cb450cdc6e5eab1bb713c03ea84c1b5', 'a0b86ef19e3d5f528e166887bfcc6c25947d7c5b2cd0e68d2459559b0a6ab4b1'], 'tools/publish_linux.sh': ['1ec8c31a545350c5eeca7d9e8f2c62b7f9ddcd349a6666b5e5c832ad9718b232', '3cc4f1f4a55dbca089a23cea7b7b375707e194dee479dd40a208756f23beb62a'], 'tools/check_content.py': ['479aa1683525d9dbbb1675a8ff9a26797a2b5a31c8a09e30102870d4a27f13d1', '8b157d343c5fd0a8c70a75a0ca764c0405982a2466762acaa82cce94836de338'], 'tools/build_seed.py': ['146a3c7d04f72137e5ea98f4875b4ad5608b410caa8b2d57b72713b7a1b4fb09', 'd0b878037f5b8432b407c86573ff08a60ce7372c9c507e23d783956c10e8baaa'], 'tools/smoke_test.py': ['b57a7a6815bdbda15fcf62f2ab2f8ab90a900bd748741b299623413b1e7f9172', 'dda19e78c060247d2923c4b7a7b08d882e7e35a26d54d8fc54ae3538a51b3f99'], 'tools/install_upgrade_linux.sh': ['7f209ced68ba06fa13f920cfbce3e08693283182ae213b42c79f093ce96f98b2']}
MIGRATE = ['index.html', 'assets/app.js', 'assets/style.css', 'README.md', 'tools/verify_linux.sh', 'tools/preview_linux.sh', 'tools/publish_linux.sh', 'tools/check_content.py', 'tools/build_seed.py', 'tools/smoke_test.py', 'tools/install_upgrade_linux.sh']
SOURCE = Path(__file__).resolve().parent.parent
HOME = Path.home()
TARGET = HOME / 'Development' / 'the-four-season-wiki'  # Stable location for V1 installs.
BACKUP_ROOT = HOME / 'Downloads'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ensure_safe_source():
    assert (SOURCE/'index.html').is_file()
    assert (SOURCE/'data/pages.json').is_file()
    assert (SOURCE/'tools/verify_linux.sh').is_file()


def check_data(path):
    data=json.loads(path.read_text(encoding='utf-8'))
    if data.get('schema')!=1 or not isinstance(data.get('pages'),list):
        raise ValueError('Unsupported existing wiki data format')
    p=next((p for p in data['pages'] if p.get('id')=='the-four-seasons'),None)
    if not p or p.get('title')!='The Four Seasons' or p.get('category')!='Party':
        raise ValueError('Missing or changed Four Seasons party entry')
    return data


def main():
    print('=== DAUGHTER OF THE MOON WIKI — SAFE V1.2 INSTALL/UPGRADE ===')
    ensure_safe_source()
    (HOME/'Development').mkdir(parents=True,exist_ok=True)
    if TARGET.is_symlink():
        raise RuntimeError('Destination is a symlink; no modifications allowed')
    if not TARGET.exists():
        temporary=Path(tempfile.mkdtemp(prefix='.daughter-wiki-install-',dir=TARGET.parent))
        try:
            shutil.copytree(SOURCE,temporary,dirs_exist_ok=True,ignore=shutil.ignore_patterns('_previews','__pycache__'))
            subprocess.run([sys.executable,'tools/check_content.py'],cwd=temporary,check=True)
            subprocess.run(['bash','tools/verify_linux.sh'],cwd=temporary,check=True)
            temporary.rename(TARGET)
            print('PASS: Fresh installation to',TARGET)
        finally:
            if temporary.exists(): shutil.rmtree(temporary)
        print('Nothing was published to GitHub.')
        return
    if not TARGET.is_dir():
        raise RuntimeError('Expected a folder at '+str(TARGET))
    current_data=TARGET/'data/pages.json'
    if not current_data.is_file() or current_data.is_symlink():
        raise RuntimeError('Existing article data is missing or linked; stopped safely')
    data=check_data(current_data)
    # Validate everything before writing ANY file.
    for rel in MIGRATE:
        old=TARGET/rel
        if old.is_symlink():raise RuntimeError('Symlinked file detected: '+rel)
        if not old.exists():
            if rel!='tools/install_upgrade_linux.sh':
                raise RuntimeError('Existing file missing: '+rel)
            continue  # V1 did not include the upgrade utility.
        if old.is_dir():raise RuntimeError('Expected a file: '+rel)
        if digest(old) not in BASELINE_HASHES[rel] and digest(old)!=digest(SOURCE/rel):
            raise RuntimeError('STOP: Custom/unknown changes in '+rel+'. No files touched; merge manually.')
    for rel in ['tools/upgrade_safe.py']:
        old=TARGET/rel
        if old.exists() and (old.is_symlink() or digest(old)!=digest(SOURCE/rel)):
            raise RuntimeError('STOP: Existing '+rel+' differs; stopped safely.')
    # Never replace article list or images. Only update public branding metadata.
    data['siteName']='Daughter of the Moon Wiki'
    # Backup before writing; survives the upgrade for user recovery.
    BACKUP_ROOT.mkdir(parents=True,exist_ok=True)
    backup=Path(tempfile.mkdtemp(prefix='daughter-wiki-before-v12-',dir=BACKUP_ROOT))
    all_paths=MIGRATE+['data/pages.json','tools/upgrade_safe.py']
    existed={rel:(TARGET/rel).exists() for rel in all_paths}
    for rel in all_paths:
        if existed[rel]:
            (backup/rel).parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(TARGET/rel,backup/rel)
    try:
        for rel in MIGRATE+['tools/upgrade_safe.py']:
            src=SOURCE/rel;dst=TARGET/rel
            dst.parent.mkdir(parents=True,exist_ok=True)
            # Atomic per-file replace avoids partial bytes if interrupted.
            with tempfile.NamedTemporaryFile(dir=dst.parent,delete=False) as out:
                temp=Path(out.name)
                out.write(src.read_bytes())
            temp.chmod(src.stat().st_mode)
            temp.replace(dst)
        dest=TARGET/'data/pages.json'
        with tempfile.NamedTemporaryFile(mode='w',encoding='utf-8',dir=dest.parent,delete=False) as out:
            json.dump(data,out,ensure_ascii=False,indent=2)
            out.write('\n')
            temp=Path(out.name)
        temp.replace(dest)
        subprocess.run([sys.executable,'tools/check_content.py'],cwd=TARGET,check=True)
        subprocess.run(['bash','tools/verify_linux.sh'],cwd=TARGET,check=True)
    except BaseException:
        print('ERROR: Restoring previous version from saved backup')
        for rel in all_paths:
            dest=TARGET/rel
            if existed[rel]:shutil.copy2(backup/rel,dest)
            elif dest.exists():dest.unlink()
        raise
    print('PASS: Existing wiki upgraded. User articles, image uploads, drafts and Git history preserved.')
    print('Backup:',backup)
    print('Nothing committed or pushed to GitHub.')


if __name__=='__main__':
    try:main()
    except Exception as e:
        print('SAFE STOP:',e)
        sys.exit(1)
