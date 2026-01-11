{
  description = "mobilesec";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      utils,
      ...
    }:

    utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };

        android-mcp = pkgs.buildNpmPackage {
          pname = "android-mcp";
          version = "1.0.0";
          src = ./.;

          npmDepsHash = "sha256-6IztZHpqp+itMF5/20RCuxuKDwSdm2/K4ZFHfuMt0vE=";

          nativeBuildInputs = [ pkgs.makeWrapper ];

          # Build the TypeScript source
          npmBuildScript = "build";

          # The node_modules are in lib/node_modules/android-mcp-server
          postInstall = ''
            makeWrapper ${pkgs.nodejs}/bin/node $out/bin/android-mcp \
              --add-flags "$out/lib/node_modules/android-mcp-server/build/index.js" \
              --prefix PATH : ${pkgs.lib.makeBinPath [ pkgs.android-tools ]}
          '';
        };
      in
      {
        packages.android-mcp = android-mcp;
        packages.default = android-mcp;

        devShells.mcp = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs
            bun

            android-tools
            lefthook
          ];

          shellHook = ''
            lefthook install
            bun install
            bun run build
            bun run start
          '';
        };

        devShells.default = pkgs.mkShell {
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
            adb connect localhost
          '';
        };
      }
    );
}
