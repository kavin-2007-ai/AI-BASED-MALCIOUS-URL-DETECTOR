"""URL Sentinel AI - Quick Interactive Terminal Scanner

Run this script directly in VS Code by clicking the Play button (▷)
at the top-right corner, or pressing F5.
"""

import sys
import os

# Add backend directory to sys.path so app module can be found
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.ml.predictor import predict_url
from app.database.connection import SessionLocal, init_db
from app.services.scan_service import save_scan_result


def print_banner():
    print("=" * 70)
    print("    URL SENTINEL AI - AI-Powered Threat Analysis Engine")
    print("=" * 70)


def scan_single_url(target_url: str):
    init_db()
    print(f"\n[*] Analyzing target: {target_url}")
    print("[*] Extracting 39 lexical, structural, and character features...")
    
    result = predict_url(target_url)

    # Persist to database
    db = SessionLocal()
    try:
        saved = save_scan_result(db, result)
        scan_id = saved.id
    except Exception as e:
        scan_id = "N/A"
    finally:
        db.close()

    # Pretty output
    print("\n" + "-" * 70)
    print(f" SCAN RESULT [ID #{scan_id}]")
    print("-" * 70)
    print(f" Target URL       : {result['normalized_url']}")
    print(f" Classification   : {result['classification']}")
    print(f" Risk Score       : {result['risk_score']} / 100")
    print(f" Engine / Model   : {result['model_name']} (v{result['model_version']})")
    print(f" Decision Mode    : {result['prediction_status']}")
    print(f" Scheme / Host    : {result['scheme']}://{result['hostname']}")
    print(f" Registered Domain: {result['registered_domain']}")
    print(f" Port             : {result['port'] if result['port'] else 'Standard'}")
    print(f" URL Length       : {result['features']['url_length']} characters")
    print(f" HTTPS Encrypted  : {'Yes' if result['features']['https_used'] else 'No (Plain HTTP)'}")
    
    print("\n[+] Detected Risk Indicators:")
    if result['indicators']:
        for ind in result['indicators']:
            print(f"  • [{ind['severity']}] {ind['title']}: {ind['description']}")
    else:
        print("  • None (Clean structural pattern)")

    print("\n[+] Explainable Analysis:")
    print(f"  {result['explanation']}")

    print("\n[+] Recommended Action:")
    print(f"  {result['recommendation']}")
    print("-" * 70 + "\n")


def main():
    print_banner()
    
    demo_urls = [
        "https://en.wikipedia.org/wiki/Computer_security",
        "http://account-verification-notice.online/update/security?token=98218",
        "http://192.168.1.105:8080/secure-update/login.php?session=token87192"
    ]

    print("Choose an option:")
    print(" 1. Run 3 Audited Test Vectors (Safe, Suspicious, Malicious)")
    print(" 2. Enter a Custom URL to scan")
    print(" 3. Exit")
    
    choice = input("\nEnter choice (1/2/3) [Default: 1]: ").strip() or "1"

    if choice == "1":
        for u in demo_urls:
            scan_single_url(u)
    elif choice == "2":
        user_url = input("\nEnter URL to analyze: ").strip()
        if user_url:
            scan_single_url(user_url)
        else:
            print("Error: No URL provided.")
    else:
        print("Exiting.")


if __name__ == "__main__":
    main()
