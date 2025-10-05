import Link from "next/link"

export default function ProfileIcon() {
    return (
        <Link href="/profile" className="profile-icon">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:bg-gray-400 transition-colors">
                <div className="w-6 h-6 bg-gray-600 rounded-full">

                </div>
            </div>
        </Link>
    )
}