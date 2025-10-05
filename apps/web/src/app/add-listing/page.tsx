import Navbar from "../components/navbar";

function AddListing() {
    return (
        <div className="min-h-screen flex flex-col">
            <div className="text-center py-4">
                <h1 className="text-2xl font-bold">Add Listing</h1>
            </div>
            <div id="navbar" className="py-4">
                <Navbar />
            </div>
            <main className="flex-1 pt-8">
                <form className="flex flex-col space-y-4 w-2/3 max-w-2xl mx-auto px-4">
                    <input 
                        type="text" 
                        placeholder="Name of Washroom" 
                        className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    <input 
                        type="text" 
                        placeholder="Description of Washroom" 
                        className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    <input 
                        type="text" 
                        placeholder="Address" 
                        className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    <input 
                        type="text" 
                        placeholder="City" 
                        className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    <div className="flex space-x-4 w-full">
                        <button 
                            type="submit" 
                            className="flex-1 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
                        >
                            Add Listing
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
    )
}

export default AddListing;
