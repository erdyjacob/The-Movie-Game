import Link from "next/link"

export default function AdminPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <nav>
        <ul>
          <li>
            <Link href="/blob-test" className="text-blue-500 hover:underline">
              Blob Storage Test
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}
