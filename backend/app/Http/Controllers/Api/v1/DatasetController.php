<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\DatasetService;
use Illuminate\Http\Request;

class DatasetController extends Controller
{
  protected DatasetService $datasetService;

  public function __construct(DatasetService $datasetService)
  {
    $this->datasetService = $datasetService;
  }

  public function index(string $tableName, Request $request)
  {
    $data = $this->datasetService->getList($tableName, $request);
    return response()->json([
      'success' => true,
      'table' => $tableName,
      'data' => $data->items(),
      'pagination' => [
        'current_page' => $data->currentPage(),
        'last_page' => $data->lastPage(),
        'per_page' => $data->perPage(),
        'total' => $data->total(),
      ],
    ]);
  }

  public function show(string $tableName, int|string $id)
  {
    return response()->json([
      'success' => true,
      'data' => $this->datasetService->find($tableName, $id),
    ]);
  }

  public function store(string $tableName, Request $request)
  {
    $created = $this->datasetService->create($tableName, $request->all());
    return response()->json([
      'success' => true,
      'message' => 'Data berhasil ditambahkan',
      'data' => $created,
    ], 201);
  }

  public function update(string $tableName, int|string $id, Request $request)
  {
    $updated = $this->datasetService->update($tableName, $id, $request->all());
    return response()->json([
      'success' => true,
      'message' => 'Data berhasil diperbarui',
      'data' => $updated,
    ]);
  }

  public function destroy(string $tableName, int|string $id)
  {
    $this->datasetService->delete($tableName, $id);
    return response()->json([
      'success' => true,
      'message' => 'Data berhasil dihapus',
    ]);
  }
}
