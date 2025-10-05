import Navbar from "../components/navbar";

function AddReview() {
    return (
        <div className="min-h-screen flex flex-col">
            <div className="text-center py-4">
                <h1 className="text-2xl font-bold">Add Review</h1>
            </div>
            <div id="navbar" className="py-4">
                <Navbar />
            </div>
            {/* Main section: block layout for simple centering */}
            <main className="flex-1 pt-8">
                {/* Centered, responsive form */}
                <form className="flex flex-col space-y-4 w-2/3 max-w-2xl mx-auto px-4">
                    <input
                        type="text"
                        placeholder="Name"
                        className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    <input
                        type="text"
                        placeholder="Review"
                        className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    <input
                        type="number"
                        placeholder="Overall Rating"
                        className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    <div className="flex space-x-4 w-full">
                        <button
                            type="submit"
                            className="flex-1 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
                        >
                            Add Review
                        </button>
                        <button
                            type="button"
                            className="flex-1 bg-gray-600 text-white p-3 rounded-lg hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}

export default AddReview;
