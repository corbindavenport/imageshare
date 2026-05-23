# How to test ImageShare

This document covers how to test ImageShare on various retro web browsers, using both real devices and emulated versions.

For local server testing, make sure to enter the full IP address or hostname (e.g. `http://192.168.50.120`) in the web browser, and not `localhost` or another alias.

## Real devices

If ImageShare is running on a local computer or server, it should be accessible to any other devices on the same network with the host's IPv4 address. For example, if the host has an IP address of `192.168.50.128`, enter `http://192.168.50.128` in the address bar of the web browser.

Some web browsers may also accept local hostnames, like `macbook.local`, as long as the host and client are both using your router's DNS relay.

### Find IP address on Linux

Run this in the Terminal to see all your active local IP addresses and hostnames:

```
hostname -I
```

You should use the IPv4 address for testing on older devices.

### Find IP adress on macOS

Run this in the Terminal to check your default Wi-Fi and Ethernet IP addresses:

```
ipconfig getifaddr en0 && ipconfig getifaddr en1
```

To see other network connections, open the Network settings in your System Settings, or run `ifconfig`.

### Find IP address on Windows

Run this in PowerShell to check your local IPv4 addresses:

```
Get-NetIPAddress -AddressFamily IPv4 | Select-Object -Property IPAddress
```

You should ignore any loopback devices, like `127.0.0.1`.

### Emulated Sony PlayStation Portable (PSP)

This needs the [JPCSP emulator](https://github.com/jpcsp/jpcsp/releases/latest), PPSSPP won't work. As of JPCSP release 2024-08, the emulator requires a [Java 8 Runtime Environment (JRE)](https://adoptium.net/temurin/releases/?version=8) and recommends a 32-bit version.

**macOS:** The native Mac version is broken, you should use a Windows VM, Wine prefix, or CrossOver Bottle.