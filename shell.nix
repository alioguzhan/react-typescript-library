with import (fetchTarball https://github.com/NixOS/nixpkgs/archive/22.05.tar.gz) { };

stdenv.mkDerivation {
  name = "--libraryname--";

  buildInputs = with pkgs; [
    git
    nodejs
    yarn
  ];
}
