

export const fetchListings = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/listings`);
    const data = await response.json();
    return data;
}

export const fetchUserReviews = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/reviews`);
    const data = await response.json();
    return data;
}

export const fetchUserListings = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/listings`);
    const data = await response.json();
    return data;
}

export const searchListings = async (query: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/listings/search?query=${query}`);
    const data = await response.json();
    return data;
}
