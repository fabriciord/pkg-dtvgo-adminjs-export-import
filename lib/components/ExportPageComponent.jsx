import { useEffect, useState } from "react";
import { ApiClient, useNotice } from "adminjs";
import { addDays } from 'date-fns';
import { saveAs } from 'file-saver';
import format from 'date-fns/format';
import {
    Box,
    Table,
    TableHead,
    TableBody,
    TableCell,
    TableRow,
    Label,
    CheckBox,
    H1,
    DatePicker,
    Button,
    Loader
} from "@adminjs/design-system";
import { is } from "date-fns/locale";

export const getExportedFileName = (extension, resourceName) => `export-${resourceName}-${format(Date.now(), 'yyyy-MM-dd_HH-mm')}.${extension}`;

const ExportImportComponent = () => {
    const [resourceList, setResourceList] = useState([]);
    const [records, setRecords] = useState([]);
    const [findResources, setFindResources] = useState(['All']);
    const [startDate, setStartDate] = useState(addDays(new Date(), -1));
    const [endDate, setEndDate] = useState(new Date());
    const [selectedRecords, setSelectedRecords] = useState({});
    const [isFetching, setFetching] = useState();
    const [isExporting, setExporting] = useState(false);
    const sendNotice = useNotice();

    const handleCheckBoxChange = (resource) => {
        setFindResources(findResources => {
            if (findResources.includes(resource)) {
                const rscs = findResources.filter((item) => item !== resource);
                if (rscs.length === 0) {
                    return ['All'];
                }
                return rscs;
            } else {
                if (resource === 'All') {
                    return ['All'];
                }
                const newResources = findResources.filter((item) => item !== 'All');

                return [...newResources, resource];
            }
        });
    };
    const handleRecordCheckBoxChange = ({ resourceId, params, relations }) => {
        if (selectedRecords[resourceId]) {
            if (selectedRecords[resourceId].findIndex((record) => record.params === params) !== -1) {
                ;
                setSelectedRecords({ ...selectedRecords, [resourceId]: selectedRecords[resourceId].filter((record) => record.params !== params) });
            } else {
                setSelectedRecords({ ...selectedRecords, [resourceId]: [...selectedRecords[resourceId], { resourceId, params, relations }] });
            }
        } else {
            setSelectedRecords({ ...selectedRecords, [resourceId]: [{ resourceId, params, relations }] });
        }
    };
    useEffect(() => {
        const fetchResources = async () => {
            try {
                setFetching(true);
                const response = await new ApiClient().getPage({
                    pageName: 'Export',
                    params: {
                        startDate: startDate.toISOString(),
                        endDate: endDate.toISOString(),
                        findResources: JSON.stringify(findResources),
                    },
                });
                setRecords(response.data.records);
                setResourceList(response.data.resourceList);
                setSelectedRecords({});
                setFetching(false);
            } catch (error) {
                console.error("Erro ao buscar os recursos:", error);
            }
        };
        fetchResources();
    }, [startDate, endDate, findResources]);
    useEffect(() => {
        if (Object.values(selectedRecords).flat(Infinity).length) {
            setExporting(true);
        } else {
            setExporting(false);
        }
    }, [selectedRecords]);

    const handlerExportJson = async () => {
        try {
            const exportedData = Object.values(selectedRecords).flat(Infinity);
            const blob = new Blob([JSON.stringify(exportedData, null, 2)], { type: 'application/json' });
            saveAs(blob, getExportedFileName('json', Object.keys(selectedRecords).join('-')));
            sendNotice({ message: 'Exported successfully', type: 'success' });
        } catch (e) {
            sendNotice({ message: e.message, type: 'error' });
        }
    };

    return (
        <Box>
            <H1 style={{ margin: '10px 10px 0px 20px' }}>Export</H1>
            <Box variant="card" display="flex" margin={{ bottom: 'xl' }}>
                <Box variant="card" width="20rem" display="flex" flexDirection="column" marginRight={15}>
                    <Label fontSize={'15px'} color='rgb(48, 64, 214)'>Resources:</Label>
                    {resourceList && resourceList.map((resourceId, index) => (
                        <div key={`div-${resourceId}-${index}`} >
                            {index === 0 && <>
                                <CheckBox
                                    label="All"
                                    checked={findResources.includes('All')}
                                    onChange={() => handleCheckBoxChange('All')}
                                    disabled={findResources.length === 1 && findResources[0] === 'All'}
                                />
                                <Label htmlFor="All" inline ml="default">
                                    All
                                </Label>
                                < br />
                            </>}
                            <CheckBox
                                key={`CheckBox-${resourceId}-${index}`}
                                label={resourceId}
                                checked={findResources.includes(resourceId)}
                                onChange={() => handleCheckBoxChange(resourceId)}
                            />
                            <Label htmlFor={resourceId} inline ml="">
                                {resourceId}
                            </Label>
                        </div>
                    ))}
                </Box>
                <Box variant="container" width="20rem" display="flex" flexDirection="column">
                    <Label fontSize={'15px'} color='rgb(48, 64, 214)'>Start Date:</Label>
                    <Box height="100%">
                        <DatePicker
                            onChange={(date) => setStartDate(new Date(date))}
                            propertyType="datetime"
                            maxDate={new Date()}
                            value={startDate.toISOString()}
                            key={`DatePicker-startDate`}
                        />
                    </Box>
                    <Label fontSize={'15px'} color='rgb(48, 64, 214)'>End Date:</Label>
                    <Box height="100%">
                        <DatePicker
                            onChange={(date) => setEndDate(new Date(date))}
                            propertyType="datetime"
                            maxDate={new Date()}
                            value={endDate.toISOString()}
                            key={`DatePicker-endDate`}
                        />
                    </Box>
                    <Button variant="outlined" disabled={!isExporting} onClick={handlerExportJson} >Exportar</Button>
                </Box>
            </Box>
            {isFetching && <Loader />}
            {!isFetching && <Box variant="grey">
                {records &&
                    Object.keys(records).map((resourceId) => (
                        <div key={resourceId}>
                            <Label fontSize={'15px'} color='rgb(48, 64, 214)'>{resourceId}:</Label>
                            <Table style={{ marginBottom: '3rem' }}>
                                {records[resourceId].map(({ params, relations }, rowIndex) => (
                                    <TableHead key={`head-${resourceId}-${rowIndex}`}>
                                        <TableRow>
                                            <TableCell>Export</TableCell>
                                            {Object.keys(params)
                                                .splice(0, 5)
                                                .map((param, index) => (
                                                    <TableCell key={`param-${resourceId}-${param}-${index}`}>{param}</TableCell>
                                                ))}
                                            {relations && <TableCell size={'1rem'}>relations</TableCell>}
                                        </TableRow>
                                    </TableHead>
                                ))[0]}
                                {records[resourceId].map(({ resourceId: rscId, params, relations }, rowIndex) => (
                                    <TableBody key={`body-${resourceId}-${rowIndex}`}>
                                        <TableRow>
                                            <TableCell>
                                                <CheckBox
                                                    key={`CheckBox-records-${resourceId}-${rowIndex}`}
                                                    checked={selectedRecords[resourceId]?.some((record) => record.params._id === params._id)}
                                                    onChange={() => handleRecordCheckBoxChange({ resourceId: rscId, params, relations })}
                                                />
                                            </TableCell>
                                            {Object.values(params)
                                                .splice(0, 5)
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
                    ))}
            </Box>}
        </Box>
    );
};

export default ExportImportComponent;
