from bson import ObjectId


def to_str_id(value: ObjectId | str | None) -> str | None:
    if value is None:
        return None
    return str(value)


def serialize_mongo(document: dict | None) -> dict | None:
    if not document:
        return document
    document["id"] = str(document.pop("_id"))
    return document
