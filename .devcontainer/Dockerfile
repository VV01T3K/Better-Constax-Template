FROM mcr.microsoft.com/devcontainers/base:trixie

USER vscode
RUN sudo apt-get update && sudo apt-get install -y --no-install-recommends npm

RUN curl https://mise.run/zsh | sh
ENV PATH="/home/vscode/.local/bin:${PATH}"
RUN mise use -g claude@latest codex@latest opencode@latest
COPY mise.toml /tmp/mise.toml
RUN cd /tmp && mise trust && mise install -y
