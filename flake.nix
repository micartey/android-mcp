{
  description = "mobilesec";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { nixpkgs, utils, ... }:

    utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };
      in
      {
        devShells.default = pkgs.mkShell rec {
          buildInputs = with pkgs; [
            just

            screen

            android-tools
            aapt
            scrcpy # For screen sharing (not needed anymore)

            androguard
            jadx
            burpsuite

            wget
          ];

          shellHook = ''
            # Open VM in background screen
            # We can access this with `screen -r`
            # screen -d -m just vm-silent

            # Make sure the vm is already started
            # sleep 10;

            adb connect localhost:5555
            bun run build
            bun run start
          '';
        };
      }
    );
}
