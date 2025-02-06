import { useEffect, useState } from "react";
import { ApiClient } from "adminjs";
import ImportComponent from "./ImportComponent";
import { Box } from "@adminjs/design-system";


const ExportImportComponent = () => {
    const [resource, setResource] = useState([]);
    useEffect(() => {
        const fetchResources = async () => {
            try {
                const response = await new ApiClient().getPage({
                    pageName: 'Import',
                });
                setResource(response.data.resource);
            } catch (error) {
                console.error("Erro ao buscar os recursos:", error);
            }
        };
        fetchResources();
    }, []);

    return (
        <>
            <Box variant="container">
                {resource && <ImportComponent resource={resource} />}
            </Box>
        </>
    )
}


export default ExportImportComponent;