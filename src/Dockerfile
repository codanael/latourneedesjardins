# Build stage
FROM denoland/deno:latest AS builder
WORKDIR /app
COPY deno.json deno.json
COPY dev.ts dev.ts

COPY fresh.config.ts fresh.config.ts
COPY fresh.gen.ts fresh.gen.ts

COPY tailwind.config.ts tailwind.config.ts

COPY main.ts main.ts

COPY components components
COPY islands islands
COPY static static
COPY utils utils
COPY routes routes

COPY tests tests

RUN deno cache main.ts
RUN deno task build

USER deno

EXPOSE 8000

CMD ["run", "-A", "main.ts"]
