import Navbar from "../components/navbar";


function AddListing() {
    return (
        <>
            <div>Add Listing</div>
            <div id='navbar' className="w-full h-full flex justify-center items-center">
                <Navbar />
            </div>
            <div className="flex justify-center items-center min-h-screen">
                <form className="flex flex-col items-center space-y-4 w-full max-w-md">
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
            </div>
        </>
    )
}

export default AddListing;