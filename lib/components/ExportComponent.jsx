import React, { useState } from 'react';
import { ApiClient, useNotice } from 'adminjs';
import { Box, Button, Loader, Text, Table, TableHead, TableBody, TableRow, TableCell } from '@adminjs/design-system';
import { saveAs } from 'file-saver';
import format from 'date-fns/format';
import { Exporters } from '../exporter.type.js';
export const mimeTypes = {
    json: 'application/json',
    csv: 'text/csv',
    xml: 'text/xml',
};
export const getExportedFileName = (extension, resourceName) => `export-${resourceName}-${format(Date.now(), 'yyyy-MM-dd_HH-mm')}.${extension}`;

const ExportComponent = ({ resource, records }) => {
    const [isFetching, setFetching] = useState();
    const sendNotice = useNotice();

    const exportData = async (type) => {
        setFetching(true);
        try {
            const { data: { exportedData }, } = await new ApiClient().resourceAction({
                method: 'post',
                resourceId: resource.id,
                actionName: 'export',
                params: {
                    type,
                },
                data: {
                    records: records.map(r => r.id),
                }
            });
            const blob = new Blob([exportedData], { type: mimeTypes[type] });
            saveAs(blob, getExportedFileName(type, resource.id));
            sendNotice({ message: 'Exported successfully', type: 'success' });
        }
        catch (e) {
            sendNotice({ message: e.message, type: 'error' });
        }
        setFetching(false);
    };
    if (isFetching) {
        return <Loader />;
    }
    return (
        <Box>
            <Box>
                <Table>
                    <TableHead>
                        <TableRow>
                            {
                                records.map(record => {
                                    const params = Object.keys(record.params);
                                    return params
                                        .map(param => <TableCell key={param}>{param}</TableCell>)
                                        .slice(0, 4);
                                })[0]
                            }
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {records.map(({ params }) => {
                            return (
                                <TableRow key={params}>
                                    {Object.values(params)
                                        .slice(0, 4)
                                        .map(param => (
                                            <TableCell key={param}>{param}</TableCell>
                                        ))}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Box>
            <Box display="flex" justifyContent="center">
                <Text variant="lg">Choose export format:</Text>
            </Box>
            <Box display="flex" justifyContent="center">
                {Exporters.map(parserType => (
                    <Box key={parserType} m={2}>
                        <Button
                            onClick={() => exportData(parserType)}
                            disabled={isFetching}
                        >
                            {parserType.toUpperCase()}
                        </Button>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};
export default ExportComponent;
