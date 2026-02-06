FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

RUN rm -f /etc/apt/sources.list.d/yarn.list

USER node

RUN curl https://mise.run/zsh | sh
ENV PATH="/home/node/.local/bin:${PATH}"
COPY mise.toml /tmp/mise.toml
RUN cd /tmp && mise trust && mise install -y
