/* eslint-disable @typescript-eslint/no-explicit-any */
type Options = {
    idColumnName?: string;
    userColumnName?: string;
    cache?: any;
    reqUserProperty?: string;
    verbose?: boolean;
};

const checkOptions = (options: Options): void => {
    if (options.userColumnName && !options.reqUserProperty) {
        throw 'You have to specify both userColumnName and reqUserProperty';
    }
    if(options.verbose === true){
        console.log('Options for sequelize: ', options);
    }
};

/**
 * Get entry by ID
 * @param model
 * @param options {Options}
 */
export const get = (model: any, options: Options = { idColumnName: 'id' }): any => async (
    req: any,
    res: any,
): Promise<any> => {
    try {
        //If no UID property on request object then return with forbidden error
        //if (req.uid === undefined) return res.status(401).send({ success: false, message: 'No token given' });
        checkOptions(options);
        const conditions = options.userColumnName
            ? { where: { [req.params[options.userColumnName]]: req[options.reqUserProperty] } }
            : {};

        const entry = await model.findByPk(req.params[options.idColumnName], conditions);
        if (!entry) return res.status(404).send({ success: false, message: 'No records found' });
        return res.send({ success: true, data: entry });
    } catch (err) {
        return res.status(500).send({ success: false, message: err });
    }
};

/**
 * Find single entry by column name
 * @param model
 * @param options {Options}
 */
export const find = (model: any, options: Options = { idColumnName: 'id' }) => async (
    req: any,
    res: any,
): Promise<any> => {
    try {
        //If no UID property on request object then return with forbidden error
        //if (req.uid === undefined) return res.status(401).send({ success: false, message: 'No token given' });

        const conditions: any = { where: { [req.params.column]: req.params.value } };
        if (options.userColumnName !== null) {
            conditions.where[options.userColumnName] = req[options.reqUserProperty];
        }
        const entry = await model.findOne(conditions);
        if (!entry) return res.status(404).send({ success: false, message: 'Niets gevonden' });
        return res.send({ success: true, data: entry });
    } catch (err) {
        return res.status(500).send({ success: false, message: err });
    }
};

/**
 * List all entries
 * @param model sequelize model
 * @param options {Options} options object
 */
export const list = (model: any, options: Options = { idColumnName: 'id' }) => async (
    req: any,
    res: any,
): Promise<any> => {
    try {
        //If no UID property on request object then return with forbidden error
        //if (req.uid === undefined) return res.status(401).send({ success: false, message: 'No token given' });
        checkOptions(options);
        const conditions = options.userColumnName
            ? { where: { [req.params[options.userColumnName]]: req[options.reqUserProperty] } }
            : {};

        let entries = [];
        if (options.cache !== undefined) {
            entries = await options.cache.get(req.uid + '_all', async () => {
                return await model.findAll(conditions);
            });
        } else {
            entries = await model.findAll(conditions);
        }
        return res.send({ success: true, data: entries });
    } catch (err) {
        return res.status(500).send({ success: false, message: err });
    }
};

/**
 * Create entry
 * @param model
 * @param options {Options}
 */
export const create = (model: any, options: Options = { idColumnName: 'id' }) => async (
    req: any,
    res: any,
): Promise<any> => {
    try {
        //If no UID property on request object then return with forbidden error
        //if (req.uid === undefined) return res.status(401).send({ success: false, message: 'No token given' });
        checkOptions(options);

        const body = req.body;
        if (options.userColumnName) {
            body[options.userColumnName] = req[options.reqUserProperty];
        }

        console.log(body);
        const entry = await model.create(body);

        return res.send({ success: true, data: entry });
    } catch (err) {
        return res.status(500).send({ success: false, message: err });
    }
};

/**
 * Update entry
 * @param model
 * @param options {Options}
 */
export const update = (model: any, options: Options = { idColumnName: 'id' }) => async (
    req: any,
    res: any,
): Promise<any> => {
    try {
        //If no UID property on request object then return with forbidden error
        //if (req.uid === undefined) return res.status(401).send({ success: false, message: 'No token given' });

        checkOptions(options);
        const body = req.body;

        if (options.userColumnName) {
            body[options.userColumnName] = req[options.reqUserProperty];
        }
        const entry = await model.update(body, { where: { [options.idColumnName]: req.params[options.idColumnName] } });

        return res.send({ success: true, data: entry });
    } catch (err) {
        return res.status(500).send({ success: false, message: err });
    }
};

/**
 * Create or update entry
 * @param model
 * @param options {Options}
 */
export const createOrUpdate = (model: any, options: Options = { idColumnName: 'id' }) => async (
    req: any,
    res: any,
): Promise<any> => {
    try {
        //If no UID property on request object then return with forbidden error
        //if (req.uid === undefined) return res.status(401).send({ success: false, message: 'No token given' });

        checkOptions(options);
        const conditions = req.body.conditions;
        const body = req.body.body;
        if (options.userColumnName) {
            conditions[options.userColumnName] = req[options.reqUserProperty];
            body[options.userColumnName] = req[options.reqUserProperty];
        }
        conditions[options.userColumnName] = req.uid;
        body[options.userColumnName] = req.uid;
        let entry = await model.findOne(conditions);
        if (entry) {
            entry = await entry.update(body);
        } else {
            entry = await model.create(body);
        }
        return res.send({ success: true, data: entry });
    } catch (err) {
        return res.status(500).send({ success: false, message: err });
    }
};

/**
 * Delete entry
 * @param model
 * @param options {Options}
 */
export const destroy = (model: any, options: Options = { idColumnName: 'id' }) => async (
    req: any,
    res: any,
): Promise<any> => {
    //If no UID property on request object then return with forbidden error
    //if (req.uid === undefined) return res.status(401).send({ success: false, message: 'No token given' });
    checkOptions(options);
    const conditions: any = { where: { [req.params[options.userColumnName]]: req[options.reqUserProperty] } };
    if (options.userColumnName !== null) {
        conditions.where[options.userColumnName] = req[options.reqUserProperty];
    }

    try {
        await model.destroy(conditions);
        return res.send({ success: true, message: 'Deleted successfully' });
    } catch (err) {
        return res.status(500).send({ success: false, message: err });
    }
};
