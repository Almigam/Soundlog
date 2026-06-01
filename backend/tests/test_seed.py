"""
Tests unitarios del catálogo de ejemplo.
"""

from core.models import Album, Song
from routes.admin import seed_catalog


def test_seed_catalog_empty_db(db_session):
    result = seed_catalog(db_session)
    assert result["seeded"] is True
    assert result["albums_count"] == 0
    assert result["songs_count"] == 0


def test_seed_catalog_skips_when_not_empty(db_session):
    db_session.add(Album(title="Test", artist="Artist"))
    db_session.commit()

    result = seed_catalog(db_session)
    assert result["seeded"] is False
    assert db_session.query(Song).count() == 0
