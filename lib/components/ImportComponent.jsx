import React, { useEffect, useState } from 'react';
import { ApiClient, useNotice } from 'adminjs';
import {
    DropZoneItem,
    Loader,
    Box,
    Button,
    DropZone,
    Label,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
} from '@adminjs/design-system';

const ImportComponent = ({ resource }) => {
    const [file, setFile] = useState(null);
    const [records, setRecords] = useState(null);
    const sendNotice = useNotice();
    const [isFetching, setFetching] = useState();
    const reader = new FileReader();

    useEffect(() => {
        if (file) {
            reader.readAsText(file);
        } else {
            setRecords(null)
        }
    }, [file]);

    const onUpload = (uploadedFile) => {
        setFile(uploadedFile?.[0] ?? null);
    };
    reader.onload = (event) => {
        try {
            const jsonContent = JSON
                .parse(event.target.result)
                .reduce((acc, record) => {
                    const { resourceId } = record;
                    if (!acc[resourceId]) {
                        acc[resourceId] = [];
                    }
                    acc[resourceId].push(record);
                    return acc;
                }, []);

            setRecords(jsonContent);
        } catch (error) {
            sendNotice({ message: `Ocorreu um erro ao tentar fazer o upload do arquivo.: ${error.message}`, type: 'error' });
        }
    };
    const onSubmit = async () => {
        if (!file) {
            return;
        }
        setFetching(true);
        try {
            const importData = new FormData();
            importData.append('file', file, file?.name);
            await new ApiClient().resourceAction({
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                method: 'post',
                resourceId: resource.id,
                actionName: 'import',
                data: importData,
            });
            sendNotice({ message: 'Imported successfully', type: 'success' });
        }
        catch (e) {
            sendNotice({ message: e.message, type: 'error' });
        }
        setFetching(false);
    };
    const handlerRemoveFile = () => {
        setFile(null);
    }
    if (isFetching) {
        return <Loader />;
    }
    return (
        <Box>
            <Box margin="auto" height={240} display="flex" justifyContent="center" flexDirection="column">
                <DropZone
                    files={[]}
                    onChange={onUpload}
                    validate={{ mimeTypes: ['application/json'] }}
                    multiple={false} />
                <DropZoneItem
                    file={file}
                    filename={file?.name || 'Nenhum arquivo'}
                    onRemove={handlerRemoveFile}
                />
                <Box display="flex" justifyContent="center" m={10}>
                    <Button
                        onClick={onSubmit}
                        disabled={!file || isFetching}>
                        Upload
                    </Button>
                </Box>
            </Box>
            <Box>
                {records &&
                    Object.keys(records).map((resourceId) => (
                        <div key={resourceId}>
                            <Label fontSize={'15px'}>{resourceId}:</Label>
                            <Table style={{ marginBottom: '2rem' }}>
                                {records[resourceId].map(({ params, relations }, rowIndex) => (
                                    <TableHead key={`head-${resourceId}-${rowIndex}`}>
                                        <TableRow>
                                            {Object.keys(params)
                                                .slice(0, 8)
                                                .map((param, index) => (
                                                    <TableCell key={`param-${resourceId}-${param}-${index}`}>{param}</TableCell>
                                                ))}
                                            {relations && <TableCell size={'1rem'}>relations</TableCell>}
                                        </TableRow>
                                    </TableHead>
                                ))[0]}
                                {records[resourceId].map(({ params, relations }, rowIndex) => (
                                    <TableBody key={`body-${resourceId}-${rowIndex}`}>
                                        <TableRow>
                                            {Object.values(params)
                                                .slice(0, 8)
                                                .map((param, index) => (
                                                    <TableCell key={`value-${resourceId}-${param}-${index}`}>{param}</TableCell>
                                                ))}
                                            {relations && (
                                                <TableCell>
                                                    {relations?.reduce((total, relation) => total + (relation.records?.length || 0), 0)}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    </TableBody>
                                ))}
                            </Table>
                        </div>
                    ))
                }
            </Box>
        </Box>
    );
};
export default ImportComponent;
