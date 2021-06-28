export default function Header() {
  const { url } = { url: 'http://localhost:8080' }
  return (
    <header>
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/error">Error</a>
      </nav>
      <label>
        URL:
        <input
          readOnly
          value={url}
          ref={(c) => c && (c.size = c.value.length)}
        />
      </label>
    </header>
  )
}
