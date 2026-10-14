"""URL Sentinel AI - URL Feature Extraction Module

Extracts lexical, structural, and character-based features from raw URLs
using urllib.parse and tldextract. Used symmetrically in training and inference.
"""

from typing import Dict, Any, List, Tuple
from urllib.parse import urlparse, parse_qs
import ipaddress
import re
import tldextract

# 16 domain/path/query indicator keywords specified in project requirements
LEXICAL_KEYWORDS = [
    "login", "verify", "account", "password", "banking", "wallet",
    "confirm", "signin", "secure", "update", "redirect", "token",
    "recovery", "bonus", "gift", "claim"
]

# Explanation mappings for explainable AI reasoning
INDICATOR_EXPLANATIONS = {
    "ip_address_hostname": "The hostname is a raw numeric IP address rather than a registered domain name, which is often used by malicious hosts to bypass domain reputation checks.",
    "long_url": "The total URL length exceeds 75 characters, which is frequently used to obscure deceptive parameters or embed obfuscated tokens.",
    "long_hostname": "The hostname is unusually long (exceeds 30 characters), often indicating attempts to imitate legitimate brands using nested subdomains.",
    "multiple_subdomains": "The URL has 3 or more subdomains, commonly observed in brand-spoofing and subdomain takeovers.",
    "suspicious_keywords_present": "Found high-risk authentication/financial keywords in the path or query string (e.g. login, verify, account, secure, bonus, claim).",
    "nonstandard_port": "The URL specifies a non-standard port instead of standard HTTP (80) or HTTPS (443), often indicating unauthorized or development servers.",
    "userinfo_syntax": "The URL contains '@' (userinfo credentials syntax) before the hostname, which can be leveraged to visually deceive users about the actual destination host.",
    "encoded_characters": "The URL contains multiple percent-encoded (%xx) characters, which can be used to evade simple pattern-matching filters.",
    "http_usage": "The URL uses unencrypted plain HTTP instead of HTTPS, lacking cryptographic identity verification and transport encryption.",
    "high_special_char_count": "Excessive special characters (hyphens, underscores, slashes, ampersands) commonly found in phishing kits and redirect chains.",
    "excessive_digits": "Unusually high number of numerical digits in the URL or hostname, frequently associated with dynamically generated malicious URLs."
}


def normalize_url(raw_url: str) -> str:
    """
    Normalizes a user-submitted URL:
    - Strips whitespace.
    - Prepends 'https://' if no scheme is provided.
    - Verifies scheme is http or https.
    """
    url = raw_url.strip()
    if not url:
        raise ValueError("URL cannot be empty.")
    
    # Check if scheme is present
    if not (url.startswith("http://") or url.startswith("https://")):
        # If user entered something like ftp:// or javascript: reject
        if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", url):
            scheme = url.split("://")[0].lower()
            if scheme not in ("http", "https"):
                raise ValueError(f"Unsupported URL scheme '{scheme}'. Only HTTP and HTTPS are permitted.")
        else:
            url = "https://" + url

    parsed = urlparse(url)
    if parsed.scheme.lower() not in ("http", "https"):
        raise ValueError(f"Unsupported URL scheme '{parsed.scheme}'. Only HTTP and HTTPS are permitted.")
    
    if not parsed.netloc:
        raise ValueError("Invalid URL: Hostname cannot be empty.")
        
    return url


def is_ip_address(hostname: str) -> bool:
    """Determines if the given hostname is an IPv4 or IPv6 address."""
    clean_host = hostname.split(":")[0]  # strip port if attached
    try:
        ipaddress.ip_address(clean_host)
        return True
    except ValueError:
        return False


def extract_features(raw_url: str) -> Tuple[Dict[str, Any], Dict[str, Any], List[str]]:
    """
    Extracts all numerical/boolean features for machine learning as well as
    metadata and human-readable detected risk indicators.
    
    Returns:
        (feature_dict, metadata_dict, detected_indicators)
    """
    normalized = normalize_url(raw_url)
    parsed = urlparse(normalized)
    
    # Extract registered domain using tldextract (Public Suffix List aware)
    extracted_tld = tldextract.extract(normalized)
    subdomain = extracted_tld.subdomain
    domain = extracted_tld.domain
    suffix = extracted_tld.suffix
    registered_domain = f"{domain}.{suffix}" if domain and suffix else domain

    hostname = parsed.hostname or ""
    path = parsed.path or ""
    query = parsed.query or ""
    scheme = parsed.scheme.lower()
    port = parsed.port
    
    # Basic lengths
    url_len = len(normalized)
    hostname_len = len(hostname)
    domain_len = len(registered_domain)
    path_len = len(path)
    query_len = len(query)

    # Character counts
    dots_count = normalized.count(".")
    hyphens_count = normalized.count("-")
    underscores_count = normalized.count("_")
    slashes_count = normalized.count("/")
    digits_count = sum(c.isdigit() for c in normalized)
    special_chars = sum(c in "!@#$%^&*()_+=-[]{}|;:'\",.<>?/`~" for c in normalized)
    encoded_chars_count = len(re.findall(r"%[0-9a-fA-F]{2}", normalized))

    # Subdomains count
    subdomains_list = [s for s in subdomain.split(".") if s]
    num_subdomains = len(subdomains_list)

    # Structural flags
    has_https = 1 if scheme == "https" else 0
    has_http = 1 if scheme == "http" else 0
    ip_host = 1 if is_ip_address(hostname) else 0
    
    # Nonstandard port: HTTP not on 80, or HTTPS not on 443
    is_nonstandard_port = 0
    if port is not None:
        if (scheme == "http" and port != 80) or (scheme == "https" and port != 443):
            is_nonstandard_port = 1

    has_userinfo = 1 if "@" in (parsed.netloc.split(":")[0] if ":" in parsed.netloc else parsed.netloc) or "@" in normalized else 0
    long_hostname_flag = 1 if hostname_len > 30 else 0
    multiple_subdomains_flag = 1 if num_subdomains >= 3 else 0
    long_path_flag = 1 if path_len > 40 else 0
    query_present = 1 if len(query) > 0 else 0
    fragment_present = 1 if len(parsed.fragment) > 0 else 0

    # Lexical keyword indicators in path and query (case-insensitive)
    search_target = (path + "?" + query).lower()
    keyword_matches = []
    lexical_features = {}
    for kw in LEXICAL_KEYWORDS:
        present = 1 if kw in search_target else 0
        lexical_features[f"kw_{kw}"] = present
        if present:
            keyword_matches.append(kw)

    # Compile feature dictionary strictly ordered for Scikit-Learn
    features = {
        "url_len": url_len,
        "hostname_len": hostname_len,
        "domain_len": domain_len,
        "path_len": path_len,
        "query_len": query_len,
        "dots_count": dots_count,
        "hyphens_count": hyphens_count,
        "underscores_count": underscores_count,
        "slashes_count": slashes_count,
        "digits_count": digits_count,
        "special_chars": special_chars,
        "num_subdomains": num_subdomains,
        "encoded_chars_count": encoded_chars_count,
        "has_https": has_https,
        "has_http": has_http,
        "ip_host": ip_host,
        "nonstandard_port": is_nonstandard_port,
        "userinfo_syntax": has_userinfo,
        "long_hostname": long_hostname_flag,
        "multiple_subdomains": multiple_subdomains_flag,
        "long_path": long_path_flag,
        "query_present": query_present,
        "fragment_present": fragment_present,
    }
    # Add 16 lexical keyword features
    features.update(lexical_features)

    # Evidence-based detected indicators (strictly based on observable features)
    detected_indicators = []
    if ip_host:
        detected_indicators.append("ip_address_hostname")
    if url_len > 75:
        detected_indicators.append("long_url")
    if long_hostname_flag:
        detected_indicators.append("long_hostname")
    if multiple_subdomains_flag:
        detected_indicators.append("multiple_subdomains")
    if len(keyword_matches) > 0:
        detected_indicators.append("suspicious_keywords_present")
    if is_nonstandard_port:
        detected_indicators.append("nonstandard_port")
    if has_userinfo:
        detected_indicators.append("userinfo_syntax")
    if encoded_chars_count >= 2:
        detected_indicators.append("encoded_characters")
    if has_http:
        detected_indicators.append("http_usage")
    if special_chars > 12:
        detected_indicators.append("high_special_char_count")
    if digits_count > 15:
        detected_indicators.append("excessive_digits")

    metadata = {
        "original_url": raw_url,
        "normalized_url": normalized,
        "scheme": scheme,
        "hostname": hostname,
        "registered_domain": registered_domain,
        "subdomain": subdomain,
        "port": port,
        "path": path,
        "query_params_count": len(parse_qs(query)),
        "matched_keywords": keyword_matches
    }

    return features, metadata, detected_indicators
