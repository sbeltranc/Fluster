<div align="center">

  # Fluster
  An (attempt to make a) minimal launcher for old versions of the [Roblox Client](https://www.roblox.com/) 
  <br>

  [Installation](#installation) • [Features](#features) • [Building](#building) • [Roadmap](#roadmap)
</div>

# Installation
Fluster is currently under development. There is no official release version or dev version, [but you can always try compiling it.](#building)

# Features
- **Vanilla 🍦**: Old Roblox Launchers tend to heavily modify the game experience by adding band-aid fixes, Fluster sticks to don't remove or edit anything from the game clients if not required.
- **Lightweight 🪶**: Fluster is compiled on a single executable (which size is <20mb) thanks to Tauri, which is a widely known building toolkit to create small and fast cross-platform applications.
- **Plug and play 🔌**: Outside of anything required by Windows to run Fluster itself, Fluster doesn't require any further steps after being installed and it's ready to launch versions.
- **Offline Compatibility 📴**: No internet connection? Fluster locally saves the client versions that you install and caches any asset used by any game when you previously had an internet connection, allowing you to play even without an internet connection.

# Roadmap
(this doesn't have any particular order and i can start or stop with any of this at any time..)

- [ ] Be able to see and join hosted servers on your LAN network
- [ ] Add a compatibility layer to both Linux and MacOS for launching the game clients
- [ ] Verifiying the game file integrity and update the game files if required to do so
- [ ] Compatibility with older versions of Windows (might not be possible due to webview)

# Building
Building Fluster is pretty simple, you don't require to-do a lot of things just to get it compiled.

What you need and require is:
- [Bun 1.2](https://bun.sh/)
- [Rust 1.86.0](https://www.rust-lang.org/)

Got all of them installed already? Good, now you want to clone the repository and get into it on your terminal:
```sh
git clone https://github.com/sbeltranc/Fluster.git && cd Fluster
```

Following that, install the required dependencies for Vite and the Tauri Scripts:
```sh
bun install
```

Everything ready to go, you can now either build Fluster or run it on dev mode:
```sh
# Building Fluster
bun run tauri build

# Running Fluster on dev mode
bun run tauri dev
```