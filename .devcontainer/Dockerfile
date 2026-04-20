FROM mcr.microsoft.com/devcontainers/typescript-node:24-bookworm

# 1. Install system dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    bubblewrap \
    curl \
    ca-certificates \
    tar \
    postgresql-client \
    python3 \
    python3-pip \
    python3-venv \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 2. Install ai-jail binary (The Akita Way)
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then BINARY="ai-jail-linux-x86_64.tar.gz"; \
    elif [ "$ARCH" = "aarch64" ]; then BINARY="ai-jail-linux-aarch64.tar.gz"; \
    else echo "Unsupported architecture: $ARCH" && exit 1; fi && \
    curl -L "https://github.com/akitaonrails/ai-jail/releases/latest/download/$BINARY" -o /tmp/ai-jail.tar.gz && \
    tar -xzf /tmp/ai-jail.tar.gz -C /usr/local/bin && \
    chmod +x /usr/local/bin/ai-jail && \
    rm /tmp/ai-jail.tar.gz

# 3. Hardening: Remove passwordless sudo for the node user
# Na PMMG você não deixa a chave da viatura no contato. Aqui é o mesmo.
RUN echo "node ALL=(ALL) ALL" > /etc/sudoers.d/node && \
    chmod 0440 /etc/sudoers.d/node

# 4. Workspace Setup & Permissions
RUN mkdir -p /workspace && chown -R node:node /workspace

# 5. Python Environment (Data Science Readiness)
# Evita o erro de 'externally-managed-environment'
ENV VIRTUAL_ENV=/home/node/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
RUN chown -R node:node $VIRTUAL_ENV

USER node
WORKDIR /workspace

# 6. Shell persistence (Melhora a UX no AI Jail)
RUN mkdir -p /home/node/.vscode-server/extensions \
    /home/node/.npm \
    && chown -R node:node /home/node