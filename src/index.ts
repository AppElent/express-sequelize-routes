type Options = {
    idColumnName?: string;
    userColumnName?: string;
    cache?: any;
};

const getOptions = (options: Options): Options => {
    if (options === undefined) options = {};
    if (options.idColumnName === undefined) options.idColumnName = 'id';
    if (options.userColumnName === undefined) options.userColumnName = 'userId';
    return options;
};

/**
 * GET function. Returns 1 ID
 * @param model
 * @param options
 */
export const get = (model, options: Options = {}): any => async (req, res) => {
    try {
        //If no UID property on request object then return with forbidden error
        if (req.uid === undefined) return res.status(401).send({ success: false, message: 'No token given' });

        options = getOptions(options);
        const entry = await model.findByPk(req.params[options.idColumnName]);
        if (!entry) return res.status(404).send({ success: false, message: 'Niets gevonden' });
        if (options.userColumnName !== null) {
            if (entry[options.userColumnName] === undefined)
                return res.status(401).send({ success: false, message: 'Geen user op model' });
            if (entry[options.userColumnName] !== req.uid)
                return res.status(401).send({ success: false, message: 'Niet toegestaan' });
        }
        return res.send({ success: true, data: entry });
    } catch (err) {
        return res.status(500).send({ success: false, message: err });
    }
};

/**
 *
 * @param model
 * @param options
 */
export const find = (model, options: Options) => async (req, res) => {
    try {
        //If no UID property on request object then return with forbidden error
        if (req.uid === undefined) return res.status(401).send({ success: false, message: 'No token given' });

        options = getOptions(options);
        const conditions = { where: { [req.params.column]: req.params.value } };
        if (options.userColumnName !== null) conditions.where[options.userColumnName] = req.uid;
        const entry = await model.findOne(conditions);
        if (!entry) return res.status(404).send({ success: false, message: 'Niets gevonden' });
        return res.send({ success: true, data: entry });
    } catch (err) {
        return res.status(500).send({ success: false, message: err });
    }
};

/**
 *
 * @param model
 * @param options
 */
export const list = (model, options: Options) => async (req, res) => {
    try {
        //If no UID property on request object then return with forbidden error
        if (req.uid === undefined) return res.status(401).send({ success: false, message: 'No token given' });

        options = getOptions(options);
        const conditions = { where: { [options.userColumnName]: req.uid } };

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
 *
 * @param model
 * @param options
 */
export const create = (model, options: Options) => async (req, res) => {
    try {
        //If no UID property on request object then return with forbidden error
        if (req.uid === undefined) return res.status(401).send({ success: false, message: 'No token given' });

        options = getOptions(options);
        const body = req.body;
        body[options.userColumnName] = req.uid;
        console.log(body);
        const entry = await model.create(body);

        return res.send({ success: true, data: entry });
    } catch (err) {
        return res.status(500).send({ success: false, message: err });
    }
};

/**
 *
 * @param model
 * @param options
 */
export const update = (model, options: Options) => async (req, res) => {
    try {
        //If no UID property on request object then return with forbidden error
        if (req.uid === undefined) return res.status(401).send({ success: false, message: 'No token given' });

        options = getOptions(options);
        const body = req.body;

        body[options.userColumnName] = req.uid;
        const entry = await model.update(body, { where: { [options.idColumnName]: req.params[options.idColumnName] } });

        return res.send({ success: true, data: entry });
    } catch (err) {
        return res.status(500).send({ success: false, message: err });
    }
};

/**
 *
 * @param model
 * @param options
 */
export const createOrUpdate = (model, options: Options) => async (req, res) => {
    try {
        //If no UID property on request object then return with forbidden error
        if (req.uid === undefined) return res.status(401).send({ success: false, message: 'No token given' });

        options = getOptions(options);

        const conditions = req.body.conditions;
        const body = req.body.body;
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
 *
 * @param model
 * @param options
 */
export const destroy = (model, options: Options) => async (req, res) => {
    //If no UID property on request object then return with forbidden error
    if (req.uid === undefined) return res.status(401).send({ success: false, message: 'No token given' });

    options = getOptions(options);
    model
        .destroy({ where: { [options.idColumnName]: req.params[options.idColumnName] } })
        .then(() => res.send({ success: true }))
        .catch(err => res.status(500).send({ success: false, message: err }));
};
