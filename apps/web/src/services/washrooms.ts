
export const fetchWashroomsInBounds = async (minLat: number, maxLat: number, minLon: number, maxLon: number) => {
    const response = await
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/washrooms/
            ?min_lat=${minLat}&max_lat=${maxLat}&min_lon=${minLon}&max_lon=${maxLon}`);
    const data = await response.json();
    return data;
}


