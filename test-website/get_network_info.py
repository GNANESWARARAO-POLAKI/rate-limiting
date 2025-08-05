#!/usr/bin/env python3
"""
Network Information Script
Shows your IP addresses and how to access the test website from network
"""

import socket
import subprocess
import platform

def get_local_ip():
    """Get the local IP address"""
    try:
        # Connect to a remote address to get local IP
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return "Unable to detect"

def get_all_ips():
    """Get all network interfaces and their IPs"""
    try:
        if platform.system() == "Windows":
            # Use ipconfig on Windows
            result = subprocess.run(['ipconfig'], capture_output=True, text=True)
            return result.stdout
        else:
            # Use ifconfig on Unix-like systems
            result = subprocess.run(['ifconfig'], capture_output=True, text=True)
            return result.stdout
    except Exception as e:
        return f"Unable to get network info: {e}"

def main():
    """Display network information"""
    PORT = 5000
    
    print("🌐 Network Information for Rate Limiting Test Website")
    print("=" * 60)
    
    # Get main local IP
    local_ip = get_local_ip()
    
    print(f"\n📱 Access URLs:")
    print(f"   Localhost: http://localhost:{PORT}")
    print(f"   Local IP:  http://{local_ip}:{PORT}")
    print(f"   All IPs:   http://0.0.0.0:{PORT}")
    
    print(f"\n🌍 Network Access:")
    print(f"   From same network: http://{local_ip}:{PORT}")
    print(f"   From other devices on your WiFi/LAN: http://{local_ip}:{PORT}")
    
    print(f"\n🔧 Testing:")
    print(f"   1. Start the server: python server.py")
    print(f"   2. Open http://localhost:{PORT} locally")
    print(f"   3. Open http://{local_ip}:{PORT} from phone/tablet on same WiFi")
    print(f"   4. Test rate limiting from different devices")
    
    print(f"\n📋 Network Interfaces:")
    print("-" * 40)
    network_info = get_all_ips()
    
    # Parse and display relevant IPs
    lines = network_info.split('\n')
    current_interface = ""
    
    for line in lines:
        line = line.strip()
        
        if platform.system() == "Windows":
            if "adapter" in line.lower() or "ethernet" in line.lower() or "wi-fi" in line.lower():
                current_interface = line
                print(f"\n🔌 {current_interface}")
            elif "IPv4 Address" in line:
                ip = line.split(':')[-1].strip()
                print(f"   IP: {ip}")
                print(f"   URL: http://{ip}:{PORT}")
        else:
            if line and not line.startswith(' ') and ':' in line:
                current_interface = line.split(':')[0]
                print(f"\n🔌 {current_interface}")
            elif "inet " in line and "127.0.0.1" not in line:
                parts = line.split()
                for i, part in enumerate(parts):
                    if part == "inet" and i + 1 < len(parts):
                        ip = parts[i + 1].split('/')[0]  # Remove subnet mask
                        print(f"   IP: {ip}")
                        print(f"   URL: http://{ip}:{PORT}")
    
    print(f"\n🔥 Firewall Note:")
    print(f"   If you can't access from other devices, check Windows Firewall")
    print(f"   Allow Python or port {PORT} through the firewall")
    
    print(f"\n🚀 Ready! Start the server with: python server.py")

if __name__ == "__main__":
    main()
