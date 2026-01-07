# Android-MCP

<div align="center">
  <img src="https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white" />
  <img src="https://img.shields.io/badge/NIXOS-5277C3.svg?style=for-the-badge&logo=NixOS&logoColor=white" />
</div>

## Setup

1. First we need to create a `qcow2` image for our vm to boot later.
This needs to be done with the following command

```bash
just create-qcow2-image
```

2. For the next step we need the `iso` image from the [android](https://www.android-x86.org/releases/releasenote-9-0-rc1.html).

3. Next, create a new VM and add the `iso` file.
Select the `qcow2` image as your drive.

4. After starting, you need to **install** android.
**DO NOT choose the Live CD**.

<details>
  <summary> The following images are a step-by-step guide on how to install it </summary>

  <div display="flex" flex-wrap="wrap">
    <img src="assets/install_1.png" width="32%" />
    <img src="assets/install_2.png" width="32%" />
    <img src="assets/install_3.png" width="32%" />
    <img src="assets/install_4.png" width="32%" />
    <img src="assets/install_5.png" width="32%" />
    <img src="assets/install_6.png" width="32%" />
    <img src="assets/install_7.png" width="32%" />
    <img src="assets/install_8.png" width="32%" />
    <img src="assets/install_9.png" width="32%" />
    <img src="assets/install_10.png" width="32%" />
    <img src="assets/install_11.png" width="32%" />
  </div>
</details>

Now you can stop the VM.

## Usage

To use your mcp server, you simply need to execute:

```bash
nix develop
```

This will open a remote mcp server via sse on `http://localhost:3134/sse`

**Make sure to start beforehand:**

```bash
just vm-silent
```
