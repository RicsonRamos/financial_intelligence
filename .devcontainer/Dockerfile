FROM mcr.microsoft.com/devcontainers/typescript-node:20

# Install system dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    bubblewrap \
    curl \
    ca-certificates \
    tar \
    postgresql-client \
    python3 \
    python3-pip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install ai-jail binary
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then BINARY="ai-jail-linux-x86_64.tar.gz"; \
    elif [ "$ARCH" = "aarch64" ]; then BINARY="ai-jail-linux-aarch64.tar.gz"; \
    else echo "Unsupported architecture: $ARCH" && exit 1; fi && \
    curl -L "https://github.com/akitaonrails/ai-jail/releases/latest/download/$BINARY" -o /tmp/ai-jail.tar.gz && \
    tar -xzf /tmp/ai-jail.tar.gz -C /usr/local/bin && \
    chmod +x /usr/local/bin/ai-jail && \
    rm /tmp/ai-jail.tar.gz

# Hardening: Remove passwordless sudo for the node user
RUN echo "node ALL=(ALL) ALL" > /etc/sudoers.d/node && \
    chmod 0440 /etc/sudoers.d/node

WORKDIR /workspace
