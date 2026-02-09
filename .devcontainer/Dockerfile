FROM mcr.microsoft.com/devcontainers/base:trixie

RUN rm -f /etc/apt/sources.list.d/yarn.list

RUN apt-get update && apt-get install -y --no-install-recommends nodejs 

USER vscode

RUN curl https://mise.run/zsh | sh
ENV PATH="/home/vscode/.local/bin:${PATH}"
COPY mise.toml /tmp/mise.toml
RUN cd /tmp && mise trust && mise install -y
RUN mise use -g claude@latest codex@latest opencode@latest
