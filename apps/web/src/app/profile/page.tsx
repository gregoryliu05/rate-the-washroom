import Navbar from "../components/navbar";


function Profile() {
    return (
        <>
            <div>
                <h1>Profile</h1>
            </div>
            <div id="navbar" className="w-full h-full flex justify-center items-center">
                <Navbar />
            </div>
            <main>
                <h2>Name</h2>
                <p>Username</p>
                <div id="recent-reviews" className="w-full h-full flex justify-center items-center">
                    <h3>Recent Reviews</h3>
                    <ul>
                        <li>Review 1</li>
                    </ul>
                </div>
                <div id="washroom-listings" className="w-full h-full flex justify-center items-center">
                    <h3>Washroom Listings</h3>
                    <ul>
                        <li>Listing 1</li>
                    </ul>
                </div>
                <div id="settings">settings</div>
                <div id="logout">logout</div>
            </main>
        </>
    )
}

export default Profile;