interface AlbumTagsProps {
  tags?: string;
}

export function AlbumTags({ tags }: AlbumTagsProps) {
  if (!tags?.trim()) return null;

  const list = tags.split(',').map((t) => t.trim()).filter(Boolean);

  return (
    <div className="album-tags">
      {list.map((tag) => (
        <span key={tag} className="album-tag">
          {tag}
        </span>
      ))}
    </div>
  );
}
