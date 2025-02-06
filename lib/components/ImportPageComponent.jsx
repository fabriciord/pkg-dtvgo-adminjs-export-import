import { useEffect, useState } from "react";
import { ApiClient } from "adminjs";
import ImportComponent from "./ImportComponent";
import { Box, Loader } from "@adminjs/design-system";


const ExportImportComponent = () => {
    const [resource, setResource] = useState([]);
    const [isFetching, setFetching] = useState();
    useEffect(() => {
        const fetchResources = async () => {
            try {
                setFetching(true);
                const response = await new ApiClient().getPage({
                    pageName: 'Import',
                });
                setResource(response.data.resource);
                setFetching(false);
            } catch (error) {
                console.error("Erro ao buscar os recursos:", error);
            }
        };
        fetchResources();
    }, []);

    return (
        <>
            {!isFetching && <ImportComponent resource={resource} />}
        </>
    )
}


export default ExportImportComponent;