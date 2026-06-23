# open

Starter pack portable de opencode: 65 agentes, 10 skills, 52 slash commands.

Docs: [STARTER.md](./STARTER.md)

## Quick start

```bash
# copiar a tu proyecto
cp -r opencode.json AGENTS.md .opencode/ .agents/ /path/a/tu/proyecto/

# abrir
cd /path/a/tu/proyecto && opencode .
```

> Para Windows PowerShell: `Copy-Item -Path "opencode.json","AGENTS.md",".opencode",".agents" -Destination "C:\path\a\tu\proyecto" -Recurse -Force`

> Si tu proyecto ya tiene un README, no se toca. El `AGENTS.md` se puede mergear/sobrescribir manualmente.
