"""
Datos de ejemplo para catálogo vacío.
Usamos URLs de portada fiables (picsum) — Wikipedia suele bloquear hotlinking.
"""

SAMPLE_ALBUMS = [
    {
        "title": "Abbey Road",
        "artist": "The Beatles",
        "release_year": 1969,
        "description": "Clásico de rock británico.",
        "cover_image_url": "https://picsum.photos/seed/soundlog-abbey/500/500",
        "tags": "classic rock,british",
        "tracks": [
            {"title": "Come Together", "artist": "The Beatles", "duration": 259},
            {"title": "Something", "artist": "The Beatles", "duration": 182},
            {"title": "Here Comes the Sun", "artist": "The Beatles", "duration": 185},
            {"title": "Oh! Darling", "artist": "The Beatles", "duration": 207},
            {"title": "Golden Slumbers", "artist": "The Beatles", "duration": 91},
        ],
    },
    {
        "title": "Random Access Memories",
        "artist": "Daft Punk",
        "release_year": 2013,
        "description": "Disco electrónico ganador del Grammy.",
        "cover_image_url": "https://picsum.photos/seed/soundlog-ram/500/500",
        "tags": "electronic,disco,summer vibes",
        "tracks": [
            {"title": "Give Life Back to Music", "artist": "Daft Punk", "duration": 274},
            {"title": "Instant Crush", "artist": "Daft Punk", "duration": 337},
            {"title": "Get Lucky", "artist": "Daft Punk", "duration": 248},
            {"title": "Lose Yourself to Dance", "artist": "Daft Punk", "duration": 353},
        ],
    },
    {
        "title": "Blonde",
        "artist": "Frank Ocean",
        "release_year": 2016,
        "description": "Álbum experimental de R&B.",
        "cover_image_url": "https://picsum.photos/seed/soundlog-blonde/500/500",
        "tags": "rnb,experimental,chill",
        "tracks": [
            {"title": "Nikes", "artist": "Frank Ocean", "duration": 317},
            {"title": "Ivy", "artist": "Frank Ocean", "duration": 249},
            {"title": "Pink + White", "artist": "Frank Ocean", "duration": 184},
            {"title": "Self Control", "artist": "Frank Ocean", "duration": 249},
        ],
    },
]
