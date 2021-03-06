import { stringify } from 'query-string';
import {
    fetchUtils,
    GET_LIST,
    GET_ONE,
    GET_MANY,
    GET_MANY_REFERENCE,
    CREATE,
    UPDATE,
    UPDATE_MANY,
    DELETE,
    DELETE_MANY,
} from 'react-admin';

import { createGetParams } from './utils';

export default (strapi, httpClient = fetchUtils.fetchJson) => {
    /**
     * Gets a list of entries
     * @param {string} resource The resource to fetch
     * @param {Object} params 
     */
    const getList = async (resource, params) => {
        // This translates React admin params to strapi params
        const strapiParams = createGetParams(params)

        // Get the list 
        const list = strapi.getEntries(resource, strapiParams);

        // Get the total
        // We'll use a hack here till strapi sdk
        // provides a default way to do this
        const count = strapi.getEntryCount(resource, strapiParams);//httpClient(`${apiUrl}/${resource}/count`);
        // We put both in a promise instead of waiting for them
        // Since they can both be done separately
        const [data, total] = await Promise.all([list, count]);

        return { data, total };
    }

    const getOne = async (resource, params) => {
        // Just pullout the Id and shove it down strapi's throat
        const {
            id
        } = params;

        // Await the arrival of the resource; bated breath recommended
        const data = await strapi.getEntry(resource, id);

        // The data will set you free
        return { data };
    }

    const createEntry = async (resource, params) => {
        // Just take the data and throw it at strapi
        const data = await strapi.createEntry(resource, params.data);

        // return the data
        return { data };
    }

    const updateEntry = async (resource, params) => {
        // Extract id and params
        const {
            id,
            data
        } = params;

        const entry = await strapi.updateEntry(resource, id, data);
        return { data: entry }
    }

    const updateManyEntries = async (resource, params) => {
        const {
            ids,
            data
        } = params;

        // update all ids and get the promises
        const allUpdates = ids.map((id) => {
            return updateEntry(resource, { id, data });
        });

        // await all updates to complete
        const updates = await Promise.all(allUpdates);

        // get the Ids of all updates
        const updatedIds = updates.map((entry) => (entry.id));

        return { data: updatedIds };
    }

    const deleteEntry = async (resource, params) => {
        // Extract id 
        const {
            id
        } = params;

        // delete the entry
        const data = await strapi.deleteEntry(resource, id);

        // return the data recieved
        return { data }
    }

    const deleteManyEntries = async (resource, params) => {
        const {
            ids
        } = params;

        const allDeletes = ids.map((id) => {
            return deleteEntry(resource, { id });
        });

        const deletes = await Promise.all(allDeletes);

        const deletedIds = deletes.map((entry) => (entry.id));

        return { data: deletedIds };
    }

    const getMany = async (resource, params) => {
        const {
            ids
        } = params;

        const allRecords = ids.map((id) => {
            return getOne(resource, { id }).then(resp => resp.data);
        });

        const data = await Promise.all(allRecords);
        return { data };
    }

    const getManyReference = async (resource, params) => {
        const {
            target
        } = params;
        params.filter[target] = params.id;

        return getList(resource, params);
    }

    return async (type, resource, params) => {
        console.log(params);
        switch (type) {
            case GET_LIST:
                return getList(resource, params);
            case GET_ONE:
                return getOne(resource, params);
            case CREATE:
                return createEntry(resource, params);
            case UPDATE:
                return updateEntry(resource, params);
            case UPDATE_MANY:
                return updateManyEntries(resource, params);
            case DELETE:
                return deleteEntry(resource, params);
            case DELETE_MANY:
                return deleteManyEntries(resource, params);
            case GET_MANY:
                return getMany(resource, params)
            case GET_MANY_REFERENCE:
                return getManyReference(resource, params)
            default:
                console.error('Action type not found')
                return false;
        }
    }
}
