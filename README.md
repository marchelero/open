# open

Pack portable de opencode: **65 agentes, 10 skills, 52 slash commands, 2 MCPs, 4 plugins, 4 CLIs cero-deps**.

Cópialo a cualquier proyecto, reinicia opencode y empieza a trabajar.

## Quick start

```bash
# copia las partes portables a tu proyecto
cp -r .opencode opencode.json AGENTS.md instructions/ /ruta/a/tu/proyecto/

# abre opencode en ese proyecto
cd /ruta/a/tu/proyecto && opencode .
```

> Windows PowerShell: `Copy-Item -Path ".opencode","opencode.json","AGENTS.md","instructions" -Destination "C:\ruta\a\tu\proyecto" -Recurse -Force`

> Si tu proyecto ya tiene un `README.md`, no se toca. Fusiona `AGENTS.md` con tus reglas propias si quieres mantener ambos.

## Documentación

Toda la documentación del pack vive dentro de `.opencode/docs/`, así se copia junto con el resto al instalar:

- **[.opencode/docs/README.md](./.opencode/docs/README.md)** — punto de entrada, instalación, comandos principales
- **[.opencode/docs/arquitectura.md](./.opencode/docs/arquitectura.md)** — 4 capas de memoria, flujo PRD, ciclo de instintos
- **[.opencode/docs/ruteo-de-agentes.md](./.opencode/docs/ruteo-de-agentes.md)** — qué sub-agente usar según la intención
- **[.opencode/docs/superficies-de-capacidad.md](./.opencode/docs/superficies-de-capacidad.md)** — cuándo usar regla vs skill vs MCP vs agente vs CLI
