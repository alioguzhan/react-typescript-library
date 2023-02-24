with import (fetchTarball https://github.com/NixOS/nixpkgs/archive/22.11.tar.gz) { };

stdenv.mkDerivation {
  name = "--libraryname--";

  buildInputs = with pkgs; [
    git
    nodejs
    yarn
  ];
}
