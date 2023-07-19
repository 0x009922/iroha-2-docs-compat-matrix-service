FROM denoland/deno:alpine
WORKDIR /app
COPY deps.ts deno.lock ./
RUN deno cache --lock=deno.lock deps.ts
COPY ./src ./src
ENV PORT=4000
CMD ["deno", "run", "--lock=deno.lock", "--cached-only", "--allow-net", "--allow-env", "--allow-read", "src/main.ts"]