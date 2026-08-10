from __future__ import annotations

import html
import io
import random
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import requests
from PIL import Image, ImageDraw, ImageFont, ImageOps, UnidentifiedImageError
from pypdf import PdfReader
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


SEED = 2026
DPI = 300
PAGE_W, PAGE_H = 2480, 3508
ROOT = Path(__file__).resolve().parent
IMAGE_DIR = ROOT / "assets" / "imagens"
FONT_DIR = ROOT / "assets" / "fontes"
OUTPUT_DIR = ROOT / "saida"
TMP_DIR = ROOT / "tmp" / "pdfs"
PDF_PATH = OUTPUT_DIR / "bingo_alfabeto_realista.pdf"
PREVIEW_PATH = OUTPUT_DIR / "previa_cartela_1.png"
CREDITS_PATH = ROOT / "CREDITOS_IMAGENS.txt"
FONT_PATH = FONT_DIR / "DancingScript-VariableFont_wght.ttf"
FONT_URL = (
    "https://raw.githubusercontent.com/google/fonts/main/ofl/dancingscript/"
    "DancingScript%5Bwght%5D.ttf"
)
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
OPENVERSE_API = "https://api.openverse.org/v1/images/"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 BingoAlfabetoEducacional/1.0"
)


@dataclass(frozen=True)
class Item:
    letter: str
    word: str
    syllables: str
    search: str


ITEMS = [
    Item("A", "abelha", "a-be-lha", "honey bee macro photograph"),
    Item("B", "bola", "bo-la", "colorful toy ball photograph"),
    Item("C", "casa", "ca-sa", "small colorful house photograph"),
    Item("D", "dado", "da-do", "single toy dice photograph"),
    Item("E", "elefante", "e-le-fan-te", "African elephant portrait photograph"),
    Item("F", "flor", "flor", "colorful flower close up photograph"),
    Item("G", "gato", "ga-to", "domestic cat portrait photograph"),
    Item("H", "helicóptero", "he-li-cóp-te-ro", "helicopter in flight photograph"),
    Item("I", "igreja", "i-gre-ja", "small church exterior photograph"),
    Item("J", "janela", "ja-ne-la", "colorful window photograph"),
    Item("K", "kiwi", "ki-wi", "kiwifruit sliced photograph"),
    Item("L", "lua", "lu-a", "full moon photograph"),
    Item("M", "macaco", "ma-ca-co", "monkey portrait photograph"),
    Item("N", "navio", "na-vi-o", "passenger ship side photograph"),
    Item("O", "ovelha", "o-ve-lha", "sheep portrait photograph"),
    Item("P", "pato", "pa-to", "duck portrait photograph"),
    Item("Q", "queijo", "quei-jo", "cheese wedge photograph"),
    Item("R", "rato", "ra-to", "mouse animal portrait photograph"),
    Item("S", "sapo", "sa-po", "frog portrait photograph"),
    Item("T", "tartaruga", "tar-ta-ru-ga", "tortoise portrait photograph"),
    Item("U", "uva", "u-va", "purple grapes bunch photograph"),
    Item("V", "vaca", "va-ca", "cow portrait photograph"),
    Item("W", "wafer", "wa-fer", "wafer biscuits photograph"),
    Item("X", "xícara", "xí-ca-ra", "colorful ceramic cup photograph"),
    Item("Y", "yakisoba", "ya-ki-so-ba", "yakisoba noodles photograph"),
    Item("Z", "zebra", "ze-bra", "zebra portrait photograph"),
]
ITEM_BY_LETTER = {item.letter: item for item in ITEMS}
FALLBACK_SEARCH = {
    "A": "honey bee", "B": "toy ball", "C": "house", "D": "dice",
    "E": "elephant", "F": "flower", "G": "cat", "H": "helicopter",
    "I": "church", "J": "window", "K": "kiwifruit", "L": "full moon",
    "M": "monkey", "N": "ship", "O": "sheep", "P": "duck",
    "Q": "cheese", "R": "mouse animal", "S": "frog", "T": "tortoise",
    "U": "purple grapes", "V": "cow", "W": "wafer biscuits",
    "X": "ceramic cup", "Y": "yakisoba", "Z": "zebra",
}

PASTELS = [
    "#FFF4B8",
    "#DCEEFF",
    "#E9DDF7",
    "#FFE2EB",
    "#DDF3DE",
]
DARK_BLUE = "#244A68"
MUTED_BLUE = "#5C86A5"
TEXT = "#2F4050"


def ensure_directories() -> None:
    for directory in (IMAGE_DIR, FONT_DIR, OUTPUT_DIR, TMP_DIR):
        directory.mkdir(parents=True, exist_ok=True)


def download_file(url: str, destination: Path) -> None:
    if destination.exists() and destination.stat().st_size > 1000:
        return
    response = requests.get(
        url, timeout=60, headers={"User-Agent": USER_AGENT}
    )
    response.raise_for_status()
    destination.write_bytes(response.content)


def get_with_retry(url: str, **kwargs) -> requests.Response:
    last_error: Exception | None = None
    for attempt in range(5):
        try:
            response = requests.get(url, **kwargs)
            if response.status_code == 429:
                time.sleep(2 ** attempt)
                continue
            response.raise_for_status()
            return response
        except requests.RequestException as exc:
            last_error = exc
            if attempt < 4:
                time.sleep(2 ** attempt)
    if last_error:
        raise last_error
    raise RuntimeError(f"Não foi possível baixar: {url}")


def strip_html(value: str | None) -> str:
    if not value:
        return "Não informado"
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", value))).strip()


def commons_image(item: Item) -> tuple[Path, dict[str, str]]:
    destination = IMAGE_DIR / f"{item.letter}_{item.word}_v2.jpg"
    metadata_path = IMAGE_DIR / f"{item.letter}_{item.word}_v2.credito.txt"
    if destination.exists() and destination.stat().st_size > 5000 and metadata_path.exists():
        fields = {}
        for line in metadata_path.read_text(encoding="utf-8").splitlines():
            if ": " in line:
                key, value = line.split(": ", 1)
                fields[key] = value
        return destination, fields

    results = []
    for search_term in (FALLBACK_SEARCH[item.letter], item.search):
        search_params = {
            "q": search_term,
            "page_size": 20,
            "mature": "false",
            "license": "pdm,cc0,by,by-sa",
        }
        search_response = get_with_retry(
            OPENVERSE_API, params=search_params, timeout=60,
            headers={"User-Agent": USER_AGENT},
        )
        results.extend(search_response.json().get("results", []))
    if not results:
        raise RuntimeError(f"Nenhuma imagem encontrada para {item.word}.")

    candidates = []
    keywords = FALLBACK_SEARCH[item.letter].lower().split()
    penalties = {
        "dog", "costume", "people", "person", "children", "child", "man",
        "woman", "boy", "girl", "abstract", "bokeh", "light trail", "store",
        "shelf", "supermarket", "street", "city",
    }
    for index, result in enumerate(results):
        width, height = result.get("width") or 0, result.get("height") or 0
        if (
            width >= 700 and height >= 500
            and max(width / height, height / width) <= 2.6
            and result.get("thumbnail")
        ):
            title = strip_html(result.get("title")).lower()
            tags = " ".join(
                tag.get("name", "") for tag in result.get("tags") or []
            ).lower()
            score = sum(6 for word in keywords if word in title)
            score += sum(1 for word in keywords if word in tags)
            score -= sum(8 for word in penalties if word in title)
            candidates.append((-score, index, result))
    if not candidates:
        raise RuntimeError(f"Sem imagem raster adequada para {item.word}.")
    selected = None
    for _, _, candidate in sorted(candidates):
        try:
            response = get_with_retry(
                candidate["thumbnail"], timeout=60,
                headers={"User-Agent": USER_AGENT},
            )
            with Image.open(io.BytesIO(response.content)) as source:
                source = ImageOps.exif_transpose(source).convert("RGB")
                source.save(destination, "JPEG", quality=94, optimize=True)
            selected = candidate
            break
        except (requests.RequestException, RuntimeError, UnidentifiedImageError, OSError):
            continue
    if selected is None:
        raise RuntimeError(f"As miniaturas disponíveis falharam para {item.word}.")

    license_name = selected.get("license", "Não informada").upper()
    license_version = selected.get("license_version") or ""
    credit = {
        "Imagem": strip_html(selected.get("title")),
        "Termo": item.word,
        "Autor": strip_html(selected.get("creator")),
        "Fonte": selected.get("foreign_landing_url") or selected.get("detail_url"),
        "Catálogo": f"Openverse / {selected.get('source', 'fonte aberta')}",
        "Licença": f"{license_name} {license_version}".strip(),
        "Página da licença": selected.get("license_url") or "Não informada",
    }
    metadata_path.write_text(
        "\n".join(f"{key}: {value}" for key, value in credit.items()),
        encoding="utf-8",
    )
    return destination, credit


def prepare_assets() -> dict[str, Path]:
    download_file(FONT_URL, FONT_PATH)
    image_paths: dict[str, Path] = {}
    credits = [
        "CRÉDITOS DAS IMAGENS",
        "",
        "Imagens localizadas pelo Openverse em fontes de conteúdo aberto.",
        "Consulte os links e respeite a licença indicada em cada entrada.",
        "",
    ]
    for index, item in enumerate(ITEMS, start=1):
        print(f"[{index:02d}/26] Preparando imagem: {item.word}")
        path, credit = commons_image(item)
        image_paths[item.letter] = path
        credits.extend(
            [
                f"{item.letter} - {item.word}",
                *[f"{key}: {value}" for key, value in credit.items()],
                "",
            ]
        )
    CREDITS_PATH.write_text("\n".join(credits), encoding="utf-8")
    return image_paths


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_PATH), size=size)


def centered_text(
    draw: ImageDraw.ImageDraw,
    xy: tuple[float, float],
    text: str,
    text_font: ImageFont.FreeTypeFont,
    fill: str,
) -> None:
    draw.text(xy, text, font=text_font, fill=fill, anchor="mm")


def make_balanced_cards() -> list[list[str]]:
    rng = random.Random(SEED)
    letters = list(ITEM_BY_LETTER)
    counts = {letter: 0 for letter in letters}
    cards = []
    for _ in range(4):
        ranked = sorted(
            letters,
            key=lambda letter: (counts[letter], rng.random()),
        )
        card = ranked[:16]
        rng.shuffle(card)
        for letter in card:
            counts[letter] += 1
        cards.append(card)
    return cards


def rounded_cell(
    draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill: str
) -> None:
    draw.rounded_rectangle(
        box, radius=28, fill=fill, outline="#AAC3D4", width=4
    )


def circular_photo(
    path: Path, size: int, background: str
) -> Image.Image:
    with Image.open(path) as source:
        source = ImageOps.exif_transpose(source).convert("RGB")
        fitted = ImageOps.fit(
            source, (size, size), method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.45),
        )
    result = Image.new("RGBA", (size + 16, size + 16), background)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
    result.paste(fitted, (8, 8), mask)
    ImageDraw.Draw(result).ellipse(
        (8, 8, size + 7, size + 7), outline="white", width=8
    )
    return result


def render_card(
    number: int, letters: list[str], image_paths: dict[str, Path]
) -> Image.Image:
    page = Image.new("RGB", (PAGE_W, PAGE_H), "#FFFDFC")
    draw = ImageDraw.Draw(page)
    centered_text(draw, (PAGE_W / 2, 104), "Bingo do Alfabeto", font(104), DARK_BLUE)
    centered_text(draw, (PAGE_W / 2, 218), f"Cartela {number}", font(58), MUTED_BLUE)

    margin_x, grid_top, gap = 80, 300, 18
    grid_w = PAGE_W - 2 * margin_x
    grid_h = PAGE_H - grid_top - 70
    cell_w = (grid_w - 3 * gap) // 4
    cell_h = (grid_h - 3 * gap) // 4

    for index, letter in enumerate(letters):
        row, col = divmod(index, 4)
        x0 = margin_x + col * (cell_w + gap)
        y0 = grid_top + row * (cell_h + gap)
        x1, y1 = x0 + cell_w, y0 + cell_h
        background = PASTELS[(row + col + number - 1) % len(PASTELS)]
        rounded_cell(draw, (x0, y0, x1, y1), background)
        item = ITEM_BY_LETTER[letter]
        center_x = (x0 + x1) / 2

        centered_text(
            draw, (center_x, y0 + 73), f"{letter} {letter.lower()}",
            font(88), DARK_BLUE,
        )
        photo_size = min(324, cell_w - 120)
        photo = circular_photo(image_paths[letter], photo_size, background)
        page.paste(
            photo,
            (int(center_x - photo.width / 2), y0 + 132),
            photo,
        )
        centered_text(draw, (center_x, y0 + 522), item.word, font(58), TEXT)
        syllable_size = 46 if len(item.syllables) <= 12 else 39
        centered_text(
            draw, (center_x, y0 + 594), item.syllables,
            font(syllable_size), MUTED_BLUE,
        )
    return page


def render_tokens(page_number: int, letters: Iterable[str]) -> Image.Image:
    page = Image.new("RGB", (PAGE_W, PAGE_H), "#FFFDFC")
    draw = ImageDraw.Draw(page)
    centered_text(draw, (PAGE_W / 2, 110), "Fichas para Sorteio", font(96), DARK_BLUE)
    centered_text(
        draw, (PAGE_W / 2, 210), f"Página {page_number} de 2",
        font(48), MUTED_BLUE,
    )
    margin_x, grid_top, gap = 100, 310, 24
    grid_w = PAGE_W - 2 * margin_x
    grid_h = PAGE_H - grid_top - 100
    cell_w = (grid_w - 3 * gap) // 4
    cell_h = (grid_h - 3 * gap) // 4

    for index, letter in enumerate(letters):
        row, col = divmod(index, 4)
        x0 = margin_x + col * (cell_w + gap)
        y0 = grid_top + row * (cell_h + gap)
        x1, y1 = x0 + cell_w, y0 + cell_h
        draw.rounded_rectangle(
            (x0, y0, x1, y1),
            radius=26,
            fill=PASTELS[index % len(PASTELS)],
            outline="#708FA6",
            width=5,
        )
        center_x, center_y = (x0 + x1) / 2, (y0 + y1) / 2
        centered_text(draw, (center_x, center_y - 65), letter, font(184), DARK_BLUE)
        centered_text(
            draw, (center_x, center_y + 122), letter.lower(),
            font(118), MUTED_BLUE,
        )
    return page


def save_pdf(pages: list[Image.Image]) -> None:
    pdf = canvas.Canvas(str(PDF_PATH), pagesize=A4, pageCompression=1)
    width_pt, height_pt = A4
    for index, page in enumerate(pages):
        buffer = io.BytesIO()
        page.save(buffer, format="JPEG", quality=95, subsampling=0, dpi=(DPI, DPI))
        buffer.seek(0)
        from reportlab.lib.utils import ImageReader
        pdf.drawImage(
            ImageReader(buffer), 0, 0,
            width=width_pt, height=height_pt,
            preserveAspectRatio=True,
        )
        pdf.showPage()
    pdf.save()


def validate(
    cards: list[list[str]], pages: list[Image.Image], image_paths: dict[str, Path]
) -> None:
    assert len(cards) == 4, "Devem existir exatamente quatro cartelas."
    assert all(len(card) == 16 for card in cards)
    assert all(len(set(card)) == 16 for card in cards), "Letra repetida em cartela."
    assert len(ITEMS) == 26 and len(image_paths) == 26
    assert all(path.exists() and path.stat().st_size > 5000 for path in image_paths.values())
    assert len(pages) == 6
    assert all(page.size == (PAGE_W, PAGE_H) for page in pages)
    assert FONT_PATH.exists() and FONT_PATH.stat().st_size > 10000
    assert PDF_PATH.exists() and PDF_PATH.stat().st_size > 100000
    reader = PdfReader(str(PDF_PATH))
    assert len(reader.pages) == 6, "O PDF deve ter seis páginas."
    assert reader.pages[0].mediabox.width > 590
    assert reader.pages[0].mediabox.height > 840
    with Image.open(PREVIEW_PATH) as preview:
        assert preview.size == (PAGE_W, PAGE_H)


def main() -> None:
    ensure_directories()
    print("Preparando fonte e imagens...")
    image_paths = prepare_assets()
    cards = make_balanced_cards()
    pages = [
        render_card(number, letters, image_paths)
        for number, letters in enumerate(cards, start=1)
    ]
    alphabet = [item.letter for item in ITEMS]
    pages.append(render_tokens(1, alphabet[:16]))
    pages.append(render_tokens(2, alphabet[16:]))
    pages[0].save(PREVIEW_PATH, "PNG", optimize=True, dpi=(DPI, DPI))
    save_pdf(pages)
    validate(cards, pages, image_paths)
    print("Validação concluída: 4 cartelas, 26 fichas e 6 páginas.")
    print(f"PDF criado em: {PDF_PATH}")
    print(f"Prévia criada em: {PREVIEW_PATH}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Erro: {exc}", file=sys.stderr)
        raise
