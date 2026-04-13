import { Model, PaginateModel } from 'mongoose';

import { BaseDocument } from '@/core/base-document.core';
import { Repository } from '@/core/repository.core';

// ──────────────────────────────────────────────
// Test-only types (avoid `any`)
// ──────────────────────────────────────────────
interface TestDoc extends BaseDocument {
  name: string;
}

interface MockDocument {
  save: jest.Mock;
  toObject: jest.Mock;
  delete: jest.Mock;
}

interface MockModel extends jest.Mock {
  findById: jest.Mock;
  findOne: jest.Mock;
  find: jest.Mock;
  insertMany: jest.Mock;
  paginate: jest.Mock;
  findByIdAndDelete: jest.Mock;
  deleteMany: jest.Mock;
}

// ──────────────────────────────────────────────
// Test Suite
// ──────────────────────────────────────────────
describe('Repository Core', () => {
  let repository: Repository<TestDoc>;
  let mockModel: MockModel;
  let mockDoc: MockDocument;

  beforeEach(() => {
    mockDoc = {
      save: jest.fn().mockResolvedValue(undefined),
      toObject: jest.fn().mockReturnValue({ id: '123', name: 'test' }),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const ModelMock = jest
      .fn()
      .mockImplementation(() => mockDoc) as unknown as MockModel;
    Object.assign(ModelMock, {
      findById: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      insertMany: jest.fn(),
      paginate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      deleteMany: jest.fn(),
    });

    mockModel = ModelMock;

    class TestRepository extends Repository<TestDoc> {
      constructor() {
        super(mockModel as unknown as Model<TestDoc>);
      }

      protected isSoftDeleteModel(): boolean {
        return true;
      }

      protected isPaginateModel(): this is this & {
        model: PaginateModel<TestDoc>;
      } {
        return true;
      }
    }

    repository = new TestRepository() as Repository<TestDoc>;
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create via constructor + save + toObject', async () => {
      const data = { name: 'test' };
      const result = await repository.create(data);

      expect(mockModel).toHaveBeenCalledWith(data);
      expect(mockDoc.save).toHaveBeenCalled();
      expect(result).toEqual({ id: '123', name: 'test' });
    });
  });

  describe('findById', () => {
    it('should call model.findById with lean', async () => {
      const leanMock = jest.fn().mockResolvedValue({ _id: '123' });
      mockModel.findById.mockReturnValue({ lean: leanMock });

      const result = await repository.findById('123');

      expect(mockModel.findById).toHaveBeenCalledWith(
        '123',
        undefined,
        undefined
      );
      expect(leanMock).toHaveBeenCalled();
      expect(result).toEqual({ _id: '123' });
    });
  });

  describe('softDeleteById', () => {
    it('should find doc and call doc.delete()', async () => {
      mockModel.findById.mockResolvedValue(mockDoc);

      const result = await repository.softDeleteById('123');

      expect(mockModel.findById).toHaveBeenCalledWith('123');
      expect(mockDoc.delete).toHaveBeenCalled();
      expect(result).toEqual({ id: '123', name: 'test' });
    });
  });

  describe('findAll (Pagination)', () => {
    it('should call model.paginate with correct options', async () => {
      const query = { page: 2, limit: 10, name: 'filter' };
      mockModel.paginate.mockResolvedValue({ docs: [], totalDocs: 0 });

      await repository.findAll(query);

      expect(mockModel.paginate).toHaveBeenCalledWith(
        { name: 'filter' },
        expect.objectContaining({ page: 2, limit: 10, lean: true })
      );
    });
  });
});
