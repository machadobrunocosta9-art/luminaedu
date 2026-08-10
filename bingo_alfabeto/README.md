# Bingo do Alfabeto

Projeto em Python que cria quatro cartelas infantis A4 e duas páginas de
fichas para sorteio. As imagens abertas são localizadas pelo Openverse e ficam
em cache local, acompanhadas dos respectivos créditos e licenças.

## Como gerar

```powershell
python -m pip install -r requirements.txt
python gerar_bingo.py
```

O resultado será criado em:

- `saida/bingo_alfabeto_realista.pdf`
- `saida/previa_cartela_1.png`

Na primeira execução é necessária conexão com a internet. Nas execuções
seguintes, as imagens e a fonte já armazenadas em `assets/` são reutilizadas.

## Características

- Papel A4, 300 dpi, pronto para impressão.
- Quatro cartelas 4x4 sem letras repetidas dentro de cada cartela.
- Distribuição equilibrada e reproduzível com `seed = 2026`.
- Duas páginas com exatamente 26 fichas recortáveis.
- Fonte cursiva Dancing Script incorporada.
- Imagens sem deformação, recortadas com `ImageOps.fit`.
- Validações automáticas de conteúdo, páginas, fontes, imagens e PDF.

As imagens permanecem sob as licenças indicadas em `CREDITOS_IMAGENS.txt`.
