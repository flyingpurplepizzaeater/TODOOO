# Collaborative TODO App - Setup Guide

## Local Development

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the server:
   ```bash
   python main.py
   ```

3. Open http://localhost:8000

## Multi-User Access with Tailscale

### Step 1: Install Tailscale

**Host PC (server):**
1. Download from https://tailscale.com/download
2. Install and sign in
3. Note your Tailscale IP (e.g., 100.x.x.x)

**Each user's device:**
1. Download Tailscale
2. Sign in with same account OR accept invite to your Tailnet

### Step 2: Run Server

On the host PC:
```bash
python main.py
```

Server runs on `0.0.0.0:8000` - accessible to all Tailscale devices.

### Step 3: Connect from Other Devices

Other users open: `http://<host-tailscale-ip>:8000`

Example: `http://100.64.0.1:8000`

## Security Notes

- Tailscale encrypts all traffic (WireGuard)
- No ports exposed to public internet
- Only Tailscale network members can access
- JWT tokens expire after 24 hours
- Passwords are bcrypt hashed
